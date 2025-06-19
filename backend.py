import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
import requests

API_KEY = '714d35d22379414698767ca0b6b0d48e'
LOG_FILE = 'search_log.txt'
FEEDBACK_FILE = 'feedback_log.txt'

shopping_list = []

class RecipeFinder:
    def __init__(self, api_key):
        self.api_key = api_key

    def find_by_ingredients(self, ingredients, number=16, offset=0, diet=None, max_calories=None):
        # Use complexSearch if diet or calories are set
        if diet or max_calories:
            url = (
                f"https://api.spoonacular.com/recipes/complexSearch"
                f"?apiKey={self.api_key}&includeIngredients={ingredients}"
                f"&number={number}&offset={offset}&addRecipeInformation=true"
            )
            if diet:
                url += f"&diet={diet}"
            if max_calories:
                url += f"&maxCalories={max_calories}"
            resp = requests.get(url)
            return resp.json()
        else:
            url = (
                f"https://api.spoonacular.com/recipes/findByIngredients"
                f"?apiKey={self.api_key}&ingredients={ingredients}"
                f"&number={number}&offset={offset}&ranking=1&ignorePantry=true"
            )
            resp = requests.get(url)
            return resp.json()

    def get_recipe_details(self, recipe_id):
        url = f"https://api.spoonacular.com/recipes/{recipe_id}/information?apiKey={self.api_key}"
        resp = requests.get(url)
        return resp.json()

    def log_search(self, ingredients):
        with open(LOG_FILE, 'a') as f:
            f.write(json.dumps({'ingredients': ingredients}) + '\n')

    def log_feedback(self, feedback):
        with open(FEEDBACK_FILE, 'a') as f:
            f.write(json.dumps({'feedback': feedback}) + '\n')

class RequestHandler(BaseHTTPRequestHandler):
    finder = RecipeFinder(API_KEY)

    def _set_headers(self, code=200):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/recipes':
            qs = parse_qs(parsed.query)
            ingredients = qs.get('ingredients', [''])[0]
            page = int(qs.get('page', [1])[0])
            diet = qs.get('diet', [''])[0]
            max_calories = qs.get('maxCalories', [None])[0]
            offset = (page - 1) * 16
            self.finder.log_search(ingredients)
            data = self.finder.find_by_ingredients(
                ingredients, 16, offset,
                diet=diet if diet else None,
                max_calories=max_calories if max_calories else None
            )
            self._set_headers()
            self.wfile.write(json.dumps(data).encode())
        elif parsed.path == '/api/recipe':
            qs = parse_qs(parsed.query)
            recipe_id = qs.get('id', [''])[0]
            data = self.finder.get_recipe_details(recipe_id)
            self._set_headers()
            self.wfile.write(json.dumps(data).encode())
        elif parsed.path == '/shopping-list':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(shopping_list).encode())
            return
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'Not found'}).encode())

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/feedback':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
                feedback = data.get('feedback', '')
                self.finder.log_feedback(feedback)
                self._set_headers()
                self.wfile.write(json.dumps({'status': 'ok'}).encode())
            except Exception:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'Invalid'}).encode())
        elif parsed.path == '/add-to-shopping-list':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            ingredients = json.loads(post_data)
            # Add only new ingredients
            for item in ingredients:
                if item not in shopping_list:
                    shopping_list.append(item)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"status": "success"}')
            return
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'Not found'}).encode())

def run(server_class=HTTPServer, handler_class=RequestHandler, port=5000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Serving backend on port {port}')
    httpd.serve_forever()

if __name__ == '__main__':
    run()
