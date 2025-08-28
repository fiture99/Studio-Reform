#!/usr/bin/env python3
"""
Studio Reform Flask Backend
Run this file to start the development server
"""

from app import app

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)