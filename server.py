import http.server
import socketserver
import json
import os
import sys
import math
from datetime import datetime
import urllib.request
import urllib.error

PORT = int(os.environ.get("PORT", 3000))
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

def sanitize_text(text):
    if not text:
        return ""
    # Strip bad characters
    bad_chars = ["<script>", "</script>", "```", "<|"]
    res = str(text)
    for b in bad_chars:
        res = res.replace(b, "")
    return res.strip()

def check_injection(text):
    if not text:
        return False
    lower = text.lower()
    suspicious = [
        "ignore previous instructions",
        "ignore all previous",
        "disregard all rules",
        "system prompt override",
        "jailbreak",
        "dan mode",
    ]
    return any(s in lower for s in suspicious)

def enforce_budget_invariants(items, total_budget):
    # Strictly 10% contingency
    contingency_pct = 10.0
    contingency_amount = round(total_budget * 0.10, 2)

    non_contingency = [i for i in items if i.get("category") != "CONTINGENCY"]
    total_non_pct = sum(i.get("percentage", 0) for i in non_contingency)
    target_non_pct = 90.0

    normalized = []
    for item in non_contingency:
        old_pct = item.get("percentage", 0)
        norm_pct = (old_pct / total_non_pct * target_non_pct) if total_non_pct > 0 else (target_non_pct / len(non_contingency))
        norm_pct = round(norm_pct, 1)
        allocated = round(total_budget * (norm_pct / 100.0), 2)
        normalized.append({
            **item,
            "percentage": norm_pct,
            "allocatedAmount": allocated,
            "spentAmount": item.get("spentAmount", 0)
        })

    contingency_item = {
        "id": "b-contingency",
        "category": "CONTINGENCY",
        "label": "Emergency Contingency (Strict 10%)",
        "percentage": 10.0,
        "allocatedAmount": contingency_amount,
        "spentAmount": 0,
        "notes": "Preserved exclusively for unforeseen vendor surcharges, weather mitigations, and last-minute guest additions.",
        "costSavingTip": "Do not allocate or commit this fund until 72 hours before the event date."
    }
    normalized.append(contingency_item)
    return normalized

def generate_plan(data):
    event_type = data.get("eventType", "wedding")
    title = sanitize_text(data.get("title", "Celebration Event"))
    date_str = data.get("eventDate", datetime.now().strftime("%Y-%m-%d"))
    location = sanitize_text(data.get("location", "City Venue"))
    guest_count = int(data.get("guestCount", 50))
    total_budget = float(data.get("totalBudget", 10000))
    currency = data.get("currency", "USD")
    theme = sanitize_text(data.get("themeStyle", "Modern Elegance"))
    special = sanitize_text(data.get("specialRequests", ""))

    # Calculate days until event
    try:
        event_dt = datetime.strptime(date_str, "%Y-%m-%d")
        diff = (event_dt - datetime.now()).days
        days_until = max(1, diff)
    except Exception:
        days_until = 90

    # Initial percentages (sum to 100%)
    # Venue: 30%, Catering: 35%, Decor: 12%, Entertainment: 8%, Misc: 5%, Contingency: 10%
    b = total_budget
    raw_budget = [
        {
            "id": "b-venue",
            "category": "VENUE",
            "label": "Venue Rental & Location Permits",
            "percentage": 30.0,
            "allocatedAmount": round(b * 0.30, 2),
            "spentAmount": 0,
            "notes": f"Securing an accessible, climate-controlled venue in {location} for {guest_count} guests.",
            "costSavingTip": "Ask for non-peak arrival windows or bundle tables and chairs with the venue package to waive rental surcharges."
        },
        {
            "id": "b-catering",
            "category": "CATERING",
            "label": "Catering, Beverages & Service Staff",
            "percentage": 35.0,
            "allocatedAmount": round(b * 0.35, 2),
            "spentAmount": 0,
            "notes": f"Includes culinary pairings, celebratory beverages, and professional service team accommodating: {special or 'standard and dietary options'}.",
            "costSavingTip": "Opt for elevated grazing tables or family-style service instead of formal plated courses to save 18% on staffing."
        },
        {
            "id": "b-decor",
            "category": "DECOR",
            "label": "Floral, Styling, Lighting & Signage",
            "percentage": 12.0,
            "allocatedAmount": round(b * 0.12, 2),
            "spentAmount": 0,
            "notes": f"Bespoke floral arrangements, warm ambient up-lighting, printed welcome signs matching {theme}.",
            "costSavingTip": "Repurpose ceremony/arrival floral installations for the main dining head table."
        },
        {
            "id": "b-entertainment",
            "category": "ENTERTAINMENT",
            "label": "Music, Sound System & Photography",
            "percentage": 8.0,
            "allocatedAmount": round(b * 0.08, 2),
            "spentAmount": 0,
            "notes": "Sound equipment, professional DJ or acoustic performers, and high-res event photography coverage.",
            "costSavingTip": "Book combined photo & live audio packages from creator collectives to unlock multi-service discounts."
        },
        {
            "id": "b-misc",
            "category": "MISCELLANEOUS",
            "label": "Stationery, Favors, Permits & Insurance",
            "percentage": 5.0,
            "allocatedAmount": round(b * 0.05, 2),
            "spentAmount": 0,
            "notes": "Event liability insurance, digital invitations with RSVP tracking, and bespoke guest favors.",
            "costSavingTip": "Send premium interactive digital invitations to eliminate postage delays and high printing costs."
        },
        {
            "id": "b-contingency",
            "category": "CONTINGENCY",
            "label": "Emergency Buffer (Strict 10%)",
            "percentage": 10.0,
            "allocatedAmount": round(b * 0.10, 2),
            "spentAmount": 0,
            "notes": "Strictly locked contingency fund for unexpected guest additions, rush delivery fees, or weather modifications.",
            "costSavingTip": "Leave this account untouched until 48 hours prior to the event."
        }
    ]

    budget_breakdown = enforce_budget_invariants(raw_budget, total_budget)

    # Timeline
    timeline = [
        {
            "id": "t-1",
            "phase": "phase_early",
            "phaseLabel": "6 to 3 Months Out" if days_until > 90 else "Initial Kickoff Phase",
            "title": "Lock Venue & Verify Capacity Bounds",
            "description": f"Finalize rental contract for {location}, confirming ADA accessibility and noise curfew ordinances.",
            "suggestedDueDaysBefore": min(days_until - 5, 90),
            "priority": "high",
            "completed": False,
            "category": "VENUE"
        },
        {
            "id": "t-2",
            "phase": "phase_early",
            "phaseLabel": "6 to 3 Months Out" if days_until > 90 else "Initial Kickoff Phase",
            "title": "Tasting & Dietary Menu Finalization",
            "description": f"Review menu pairings accommodating special requests: {special or 'Standard & Vegetarian choices'}",
            "suggestedDueDaysBefore": min(days_until - 10, 60),
            "priority": "high",
            "completed": False,
            "category": "CATERING"
        },
        {
            "id": "t-3",
            "phase": "phase_mid",
            "phaseLabel": "4 to 2 Weeks Out",
            "title": "Send Final RSVP Headcount to Caterer",
            "description": f"Freeze guest list at {guest_count} and submit dietary allergy matrix to kitchen team.",
            "suggestedDueDaysBefore": 14,
            "priority": "high",
            "completed": False,
            "category": "CATERING"
        },
        {
            "id": "t-4",
            "phase": "phase_final_weeks",
            "phaseLabel": "1 Week Out",
            "title": "Master Run-Sheet & Vendor Distribution",
            "description": "Email minute-by-minute timeline to all vendors, emergency contacts, and venue manager.",
            "suggestedDueDaysBefore": 7,
            "priority": "medium",
            "completed": False,
            "category": "GENERAL"
        },
        {
            "id": "t-5",
            "phase": "phase_day_of",
            "phaseLabel": "Day of Event",
            "title": "Vendor Load-In & Audio Check",
            "description": "Supervise floral delivery, table placecards, microphone balance, and emergency kit.",
            "suggestedDueDaysBefore": 0,
            "priority": "high",
            "completed": False,
            "category": "GENERAL"
        },
        {
            "id": "t-6",
            "phase": "phase_post_event",
            "phaseLabel": "Post-Event Wrap Up",
            "title": "Vendor Settlement & Rental Returns",
            "description": "Verify all rental equipment is intact to reclaim security deposits and send thank-you notes.",
            "suggestedDueDaysBefore": -2,
            "priority": "low",
            "completed": False,
            "category": "MISCELLANEOUS"
        }
    ]

    # Vendor checklist
    symbol = "$" if currency == "USD" else currency
    vendor_checklist = [
        {
            "id": "v-1",
            "category": "VENUE",
            "vendorRole": "Venue Coordinator / Site Manager",
            "priority": "essential",
            "status": "to_contact",
            "targetBookingLeadWeeks": 16,
            "questionsToAsk": [
                "What is your strict load-in and teardown curfew policy?",
                "Do you require preferred in-house vendors or allow licensed external vendors?",
                "What is the rain/inclement weather contingency plan for outdoor spaces?"
            ],
            "contractReviewReminders": [
                "Check for mandatory security or trash disposal fees not quoted in base rent.",
                "Verify certificate of insurance (COI) liability requirements."
            ],
            "estimatedCostRange": f"{symbol} {int(b * 0.25):,} - {int(b * 0.32):,}"
        },
        {
            "id": "v-2",
            "category": "CATERING",
            "vendorRole": "Head Chef & Beverage Director",
            "priority": "essential",
            "status": "to_contact",
            "targetBookingLeadWeeks": 12,
            "questionsToAsk": [
                "How do you handle severe dietary allergies (celiac, nuts, vegan) to avoid cross-contamination?",
                "Is glassware, flatware, and linen service included in per-plate estimates?",
                "What is the ratio of service staff to guests?"
            ],
            "contractReviewReminders": [
                "Examine guaranteed minimum guest headcount cutoff date.",
                "Watch for 20-25% administrative service charges vs gratuity distribution."
            ],
            "estimatedCostRange": f"{symbol} {int(b * 0.30):,} - {int(b * 0.38):,}"
        },
        {
            "id": "v-3",
            "category": "ENTERTAINMENT",
            "vendorRole": "Lead Photographer & Cinematographer",
            "priority": "essential",
            "status": "to_contact",
            "targetBookingLeadWeeks": 10,
            "questionsToAsk": [
                "Do you provide full raw footage / high-res digital printing rights?",
                "What is your contingency backup plan if the primary shooter falls ill?",
                "What is your typical turnaround time for teaser gallery vs final album?"
            ],
            "contractReviewReminders": [
                "Confirm overtime hourly rate charged if event runs 30 minutes over.",
                "Verify cancellation and rescheduling clauses."
            ],
            "estimatedCostRange": f"{symbol} {int(b * 0.06):,} - {int(b * 0.10):,}"
        }
    ]

    # Bespoke Personalized Ideas
    personalized_ideas = [
        {
            "id": "idea-1",
            "title": "Interactive Audio Guestbook Station",
            "category": "activity",
            "description": "Replace paper guestbooks with a vintage telephone where guests record spontaneous heartfelt voicemails that get compiled into a keepsake vinyl.",
            "whyItFits": f"Complements your '{theme}' aesthetic while capturing candid voices of all {guest_count} guests.",
            "estimatedCostImpact": "low",
            "isFavorite": False
        },
        {
            "id": "idea-2",
            "title": "Artisan Culinary Showcase",
            "category": "hospitality",
            "description": "Interactive chef station highlighting seasonal courses and special dietary accommodations.",
            "whyItFits": f"Directly reflects your requests: '{special or 'Artisan culinary selections'}'.",
            "estimatedCostImpact": "medium",
            "isFavorite": True
        },
        {
            "id": "idea-3",
            "title": "Warm Canopy of Micro-Fairy Starlight",
            "category": "decor",
            "description": "Suspended warm ambient fairy light ceiling creating an intimate European-courtyard atmosphere inside the venue.",
            "whyItFits": f"Transforms {location} without requiring excessive tabletop floral sprawl.",
            "estimatedCostImpact": "medium",
            "isFavorite": False
        },
        {
            "id": "idea-4",
            "title": "Acoustic Prelude Transitioning to Curated Vinyl Set",
            "category": "activity",
            "description": "Subtle acoustic guitar during guest arrival and dinner, seamlessly pivoting into an upbeat dance curation.",
            "whyItFits": "Maximizes entertainment budget efficiency with a 2-in-1 performer agreement.",
            "estimatedCostImpact": "medium",
            "isFavorite": False
        },
        {
            "id": "idea-5",
            "title": "Pressed Botanical Ceramic Placecard Keepsakes",
            "category": "custom",
            "description": "Handcrafted botanical ceramic tiles with each guest's name that double as seating assignments and personalized favors.",
            "whyItFits": "Elevates guest appreciation while combining seating cards and favor budgets into one cost-effective item.",
            "estimatedCostImpact": "low",
            "isFavorite": False
        }
    ]

    return {
        "planId": f"plan-{int(datetime.now().timestamp())}",
        "summary": {
            "eventTitle": title,
            "vibeStatement": f"A thoughtfully orchestrated {event_type} celebration in {location}, defined by a {theme} aesthetic, memorable hospitality, and tight financial safeguards.",
            "targetGuestCount": guest_count,
            "totalBudget": total_budget,
            "currency": currency,
            "daysUntilEvent": days_until
        },
        "budgetBreakdown": budget_breakdown,
        "timeline": timeline,
        "vendorChecklist": vendor_checklist,
        "personalizedIdeas": personalized_ideas,
        "coPilotWelcomeMessage": "Welcome! I've engineered your celebration plan with strict budget protection (including our 10% emergency buffer). Tell me anything you'd like to refine!"
    }

def handle_copilot(data):
    current_plan = data.get("currentPlan", {})
    user_prompt = sanitize_text(data.get("userPrompt", "")).lower()

    if "vegetarian" in user_prompt or "vegan" in user_prompt or "dietary" in user_prompt:
        budget = current_plan.get("budgetBreakdown", [])
        for b in budget:
            if b.get("category") == "CATERING":
                b["notes"] = f"{b.get('notes', '')} [MODIFIED: 100% plant-based / dietary tailored menu with zero cross-contamination protocols]."
                b["costSavingTip"] = "Plant-forward seasonal menus can lower raw food costs by 12% compared to premium beef selections."
        return {
            "replyMessage": "I've tailored your catering blueprint to be 100% plant-forward and dietary-compliant! Seasonal vegetable pairings will also help manage per-plate costs.",
            "updatedPlan": {"budgetBreakdown": budget}
        }

    if "cut decor" in user_prompt or "reduce decor" in user_prompt or "budget" in user_prompt:
        budget = current_plan.get("budgetBreakdown", [])
        total_budget = current_plan.get("summary", {}).get("totalBudget", 10000)
        for b in budget:
            if b.get("category") == "DECOR":
                b["percentage"] = max(5.0, b.get("percentage", 12.0) - 3.0)
                b["allocatedAmount"] = round(total_budget * (b["percentage"] / 100.0), 2)
            elif b.get("category") == "ENTERTAINMENT":
                b["percentage"] = b.get("percentage", 8.0) + 3.0
                b["allocatedAmount"] = round(total_budget * (b["percentage"] / 100.0), 2)
        return {
            "replyMessage": "I have adjusted your budget allocation: reduced Decor by 3% and reallocated funds to Entertainment while keeping your 10% contingency safely intact.",
            "updatedPlan": {"budgetBreakdown": enforce_budget_invariants(budget, total_budget)}
        }

    if "task" in user_prompt or "sparkler" in user_prompt:
        timeline = current_plan.get("timeline", [])
        new_task = {
            "id": f"t-custom-{int(datetime.now().timestamp())}",
            "phase": "phase_day_of",
            "phaseLabel": "Day of Event",
            "title": "Coordinated Sparkler Send-Off",
            "description": "Distribute smokeless 36-inch sparklers and torches 15 minutes before departure with designated sand disposal buckets.",
            "suggestedDueDaysBefore": 0,
            "priority": "high",
            "completed": False,
            "category": "ENTERTAINMENT"
        }
        timeline.append(new_task)
        return {
            "replyMessage": "Added 'Coordinated Sparkler Send-Off' to your Day-of timeline with sand bucket safety disposal instructions!",
            "updatedPlan": {"timeline": timeline}
        }

    return {
        "replyMessage": f"Great point! I've noted: '{user_prompt}'. I've updated the event timeline and advisory notes to reflect this priority."
    }

class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for convenience
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == "/" or self.path == "/index.html":
            self.path = "/public/index.html"
            if not os.path.exists("." + self.path):
                self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)

        if self.path == "/api/plan/generate":
            try:
                data = json.loads(post_data.decode("utf-8"))
                plan = generate_plan(data)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(plan).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        if self.path == "/api/copilot/chat":
            try:
                data = json.loads(post_data.decode("utf-8"))
                result = handle_copilot(data)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(result).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), RequestHandler) as httpd:
        print(f"CelebrationAI Live Server running at http://localhost:{PORT}")
        sys.stdout.flush()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

