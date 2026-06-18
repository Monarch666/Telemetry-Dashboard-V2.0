from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__, template_folder='public')

PARAMS_DIR = os.path.join(os.getcwd(), "params")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/params/<filename>')
def serve_param(filename):
    return send_from_directory(PARAMS_DIR, filename)

@app.route('/static/<path:path>')
def static_files(path):
    return send_from_directory('static', path)

if __name__ == "__main__":
    print("Flask server running on port 8000 (Next.js dashboard runs on 5000)")
    app.run(host="0.0.0.0", port=8000, debug=True)