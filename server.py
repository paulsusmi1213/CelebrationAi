#!/usr/bin/env python3
"""
CelebrationAI Live Development Server
Serves static frontend assets and handles GenAI API endpoints (/api/plan, /api/copilot)
"""

import http.server
import socketserver
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, date

PORT = 3000
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')

class CelebrationHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_POST(self):
        content_len = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_len) if content_len > 0 else b'{}'
        
        try:
            payload = json.loads(post_data.decode('utf-8'))
        except Exception:
            payload = {}

        if self.path == '/api/plan':
            self.handle_plan(payload)
        elif self.path == '/api/copilot':
            self.handle_copilot(payload)
        else:
            self.send_error(404, "Endpoint Not Found")

    def handle_plan(self, data):
        event_type = data.get('eventType', 'WEDDING')
        event_name = data.get('eventName', 'Celebration Gala')
        event_date_str = data.get('eventDate', '2027-06-15')
        location = data.get('location', 'San Francisco, CA')
        guest_count = int(data.get('guestCount', 100))
        total_budget = float(data.get('totalBudget', 30000))
        currency = data.get('currency', 'USD')
        theme = data.get('themePreferences', 'Modern botanical elegance')
        special = data.get('specialRequests', 'Dietary accommodation')

        gemini_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
        plan = None

        if gemini_key:
            plan = self.call_gemini_api(gemini_key, data)

        if not plan:
            plan = self.generate_mock_plan(event_type, event_name, event_date_str, location, guest_count, total_budget, currency, theme, special)

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'success': True, 'data': plan}).encode('utf-8'))

    def call_gemini_api(self, api_key, data):
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            prompt = f"Generate an event plan JSON for {data.get('eventName')} with budget {data.get('totalBudget')} {data.get('currency')}, {data.get('guestCount')} guests, event date {data.get('eventDate')} in {data.get('location')}."
            req_body = json.dumps({
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"}
            }).encode('utf-8')
            
            req = urllib.request.Request(url, data=req_body, headers={'Content-Type': 'application/json'}, method='POST')
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                text = res_data['candidates'][0]['content']['parts'][0]['text']
                return json.loads(text)
        except Exception as e:
            return None

    def generate_mock_plan(self, event_type, event_name, event_date_str, location, guests, total, currency, theme, special):
        is_wedding = (event_type == 'WEDDING')
        is_birthday = (event_type == 'BIRTHDAY')
        is_community = (event_type == 'COMMUNITY')

        venue_pct = 30 if is_wedding else (25 if is_community else 20)
        catering_pct = 30 if is_wedding else (35 if is_birthday else 30)
        decor_pct = 15
        ent_pct = 10 if is_wedding else 15
        misc_pct = 5
        contingency_pct = 10

        budget = [
            {
                "id": "b-venue",
                "category": "Venue & Facilities",
                "percentage": venue_pct,
                "allocatedAmount": round(total * venue_pct / 100),
                "actualSpent": 0,
                "costSavingTip": "Inquire if booking an off-peak day (Friday/Sunday) or morning block unlocks a 15-20% discount.",
                "isContingency": False
            },
            {
                "id": "b-catering",
                "category": "Catering & Beverage Service",
                "percentage": catering_pct,
                "allocatedAmount": round(total * catering_pct / 100),
                "actualSpent": 0,
                "costSavingTip": f"With {guests} guests, choosing artisan food stations instead of plated multi-course dining saves 20% on server staffing.",
                "isContingency": False
            },
            {
                "id": "b-decor",
                "category": "Decor, Florals & Styling",
                "percentage": decor_pct,
                "allocatedAmount": round(total * decor_pct / 100),
                "actualSpent": 0,
                "costSavingTip": "Repurpose stage or ceremony floral arrangements into reception dining table centerpieces.",
                "isContingency": False
            },
            {
                "id": "b-entertainment",
                "category": "Entertainment & Audio/Visual",
                "percentage": ent_pct,
                "allocatedAmount": round(total * ent_pct / 100),
                "actualSpent": 0,
                "costSavingTip": "Contract a sound and lighting package bundled with your MC to eliminate separate travel and rental line items.",
                "isContingency": False
            },
            {
                "id": "b-misc",
                "category": "Miscellaneous & Stationery",
                "percentage": misc_pct,
                "allocatedAmount": round(total * misc_pct / 100),
                "actualSpent": 0,
                "costSavingTip": "Adopt digital interactive RSVPs to eliminate high-volume paper printing and postage fees.",
                "isContingency": False
            },
            {
                "id": "b-contingency",
                "category": "Contingency Reserve (10%)",
                "percentage": contingency_pct,
                "allocatedAmount": round(total * contingency_pct / 100),
                "actualSpent": 0,
                "costSavingTip": "Safeguarded until 14 days prior to absorb unexpected guest count shifts or weather changes.",
                "isContingency": True
            }
        ]

        timeline = [
            {
                "id": "t-1",
                "phase": "6+ Months Out",
                "title": f"Reserve Primary Location in {location}",
                "description": f"Lock in venue contract for {guests} guests. Verify liquor license, curfew laws, and vendor access hours.",
                "targetDateDescription": "6 Months Prior",
                "priority": "HIGH",
                "isCompleted": False
            },
            {
                "id": "t-2",
                "phase": "3-5 Months Out",
                "title": "Tasting Session & Finalize Caterer",
                "description": f"Incorporate dietary requirements: {special or 'standard menu'}. Finalize beverage tier.",
                "targetDateDescription": "4 Months Prior",
                "priority": "HIGH",
                "isCompleted": False
            },
            {
                "id": "t-3",
                "phase": "1-2 Months Out",
                "title": "Launch RSVP Portal & Invitation Distribution",
                "description": f"Communicate dress code and itinerary aligned with {theme or 'event aesthetic'}.",
                "targetDateDescription": "6-8 Weeks Prior",
                "priority": "MEDIUM",
                "isCompleted": False
            },
            {
                "id": "t-4",
                "phase": "2-4 Weeks Out",
                "title": "Submit Final Headcount to Caterer",
                "description": "Lock in guaranteed meal counts, seating chart, and dietary accommodation cards.",
                "targetDateDescription": "14 Days Prior",
                "priority": "HIGH",
                "isCompleted": False
            },
            {
                "id": "t-5",
                "phase": "1 Week Out",
                "title": "Run-of-Show Master Walkthrough",
                "description": "Distribute minute-by-minute contact sheet to coordinator, DJ/MC, and family leaders.",
                "targetDateDescription": "7 Days Prior",
                "priority": "HIGH",
                "isCompleted": False
            },
            {
                "id": "t-6",
                "phase": "Day-of",
                "title": "Day-Of Execution & Vendor Arrival Check-In",
                "description": "Oversee load-in, AV soundcheck, staging setup, and welcome guests.",
                "targetDateDescription": "Morning of Event",
                "priority": "CRITICAL",
                "isCompleted": False
            }
        ]

        vendors = [
            {
                "id": "v-1",
                "vendorType": "Venue Coordinator",
                "priority": "CRITICAL",
                "status": "PENDING",
                "estimatedCost": round(total * venue_pct / 100),
                "questionsToAsk": [
                    "What time does morning load-in open for decorators and caterers?",
                    "Are security and post-event janitorial services included in base pricing?",
                    "What is your exact rain/weather contingency backup space?"
                ],
                "contractWatchouts": [
                    "Check for mandatory 20-24% service charges and alcohol corkage fees.",
                    "Verify exact cancellation and refund schedules."
                ]
            },
            {
                "id": "v-2",
                "vendorType": "Caterer & Beverage Service",
                "priority": "CRITICAL",
                "status": "PENDING",
                "estimatedCost": round(total * catering_pct / 100),
                "questionsToAsk": [
                    "How do you isolate meals for severe allergies and dietary constraints?",
                    "Do you supply bussing, cleanup staff, glassware, and tableware?",
                    "What is the final deadline to update attendee counts?"
                ],
                "contractWatchouts": [
                    "Beware of cake-cutting fees or per-server overtime billing multipliers."
                ]
            },
            {
                "id": "v-3",
                "vendorType": "Photographer / Videographer",
                "priority": "HIGH",
                "status": "PENDING",
                "estimatedCost": round(total * 0.12),
                "questionsToAsk": [
                    "Have you photographed this venue previously under evening lighting?",
                    "What is your delivery timeframe for high-res unwatermarked galleries?",
                    "Do you carry redundant camera bodies, lenses, and dual memory card slots?"
                ],
                "contractWatchouts": [
                    "Ensure contract guarantees full digital download and personal printing rights."
                ]
            },
            {
                "id": "v-4",
                "vendorType": "DJ / Sound Engineer",
                "priority": "HIGH",
                "status": "PENDING",
                "estimatedCost": round(total * ent_pct / 100),
                "questionsToAsk": [
                    "Do you supply wireless microphones for speeches and toasts?",
                    "How do you handle guest song requests and do-not-play lists?",
                    "What are your electrical load and outlet requirements?"
                ],
                "contractWatchouts": [
                    "Confirm backup equipment is available on-site in case of laptop/mixer malfunction."
                ]
            }
        ]

        ideas = [
            {
                "id": "i-1",
                "title": "Interactive Audio Guestbook & Memory Phone",
                "category": "Activity & Flow",
                "description": "Set up a vintage rotary telephone lounge where guests pick up the receiver to record spontaneous voice messages and milestone memories.",
                "estimatedCostImpact": "Low ($)"
            },
            {
                "id": "i-2",
                "title": f"Bespoke Signature Mocktail/Cocktail Tasting Flights",
                "category": "Food & Beverage",
                "description": f"Serve two customized drinks inspired by local landmarks in {location}, paired with artisanal garnish skewers.",
                "estimatedCostImpact": "Moderate ($$)"
            },
            {
                "id": "i-3",
                "title": "Warm Ambient Fairy Light & Projection Canopy",
                "category": "Decor & Aesthetics",
                "description": f"Create an ethereal glowing canopy with warm amber uplighting and fairy strands styled to {theme or 'your vision'}.",
                "estimatedCostImpact": "Moderate ($$)"
            },
            {
                "id": "i-4",
                "title": "Acoustic Sunset Interlude",
                "category": "Theme & Vibe",
                "description": "Smoothly transition guests from ceremony to cocktail hour with a live fingerstyle guitarist playing modern melodic favorites.",
                "estimatedCostImpact": "Moderate ($$)"
            },
            {
                "id": "i-5",
                "title": "Zero-Waste Botanical Keepsake Favors",
                "category": "Community Impact",
                "description": "Provide seeded plantable place cards with wild lavender and poppy seeds that guests take home to plant.",
                "estimatedCostImpact": "Low ($)"
            }
        ]

        return {
            "planSummary": f"Custom {event_type.lower()} architecture for '{event_name}' in {location} on {event_date_str}. Configured for {guests} guests with a budget of {currency} {total:,.0f}, including a locked 10% contingency reserve ({currency} {round(total*0.1):,.0f}).",
            "budgetBreakdown": budget,
            "timeline": timeline,
            "vendors": vendors,
            "bespokeIdeas": ideas
        }

    def handle_copilot(self, data):
        msg = data.get('message', '').lower()
        current_plan = data.get('currentPlan', {})
        budget = current_plan.get('budgetBreakdown', [])
        
        reply = f"I've processed your instruction: '{data.get('message')}'. "
        modifications = {}

        if 'vegetarian' in msg or 'vegan' in msg:
            for b in budget:
                if 'catering' in b.get('category', '').lower():
                    b['notes'] = "Updated: 100% gourmet plant-based menu."
                    b['costSavingTip'] = "Seasonal plant-based menus often yield 10-15% cost savings on premium proteins."
            modifications['updatedBudget'] = budget
            reply += "Converted catering profile to 100% plant-based / vegetarian and refreshed cost-saving guidance."

        if 'cut' in msg and 'decor' in msg and ('20%' in msg or '20 percent' in msg):
            cut_amount = 0
            for b in budget:
                if 'decor' in b.get('category', '').lower():
                    cut_amount = round(b.get('allocatedAmount', 0) * 0.2)
                    b['allocatedAmount'] -= cut_amount
                    b['percentage'] = round(b['percentage'] * 0.8 * 10) / 10
            for b in budget:
                if b.get('isContingency'):
                    b['allocatedAmount'] += cut_amount
                    b['percentage'] = round((b['percentage'] + (b['percentage'] * 0.2)) * 10) / 10
            modifications['updatedBudget'] = budget
            reply += f" Trimmed decor budget by 20% (-${cut_amount:,}) and reallocated the surplus into your Contingency reserve."

        if 'photobooth' in msg or 'photo booth' in msg:
            modifications['addedTasks'] = [{
                "id": f"t-photobooth-{int(datetime.now().timestamp())}",
                "phase": "2-4 Weeks Out",
                "title": "Book 360 Open-Air Photobooth & Custom Props",
                "description": "Contract modern interactive camera kiosk with instant SMS/AirDrop sharing.",
                "targetDateDescription": "3 Weeks Prior",
                "priority": "MEDIUM",
                "isCompleted": False
            }]
            reply += " Scheduled a new task to contract a 360 photobooth 3 weeks prior."

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'success': True, 'reply': reply, 'modifications': modifications}).encode('utf-8'))

def run_server():
    server_address = ('', PORT)
    try:
        httpd = socketserver.TCPServer(server_address, CelebrationHandler)
        print(f"CelebrationAI Server listening on http://localhost:{PORT}")
        httpd.serve_forever()
    except OSError as e:
        if "address already in use" in str(e).lower() or e.errno == 98 or e.errno == 10048:
            alt_port = PORT + 1
            httpd = socketserver.TCPServer(('', alt_port), CelebrationHandler)
            print(f"CelebrationAI Server listening on http://localhost:{alt_port}")
            httpd.serve_forever()
        else:
            raise e

if __name__ == '__main__':
    run_server()

