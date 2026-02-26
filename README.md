# Project Description
    Students often struggle to understand course
    material, identify their weaknesses, and determine how best to allocate their study time.
    Instructors, meanwhile, face challenges in identifying class-wide learning gaps and creating
    engaging instructional content efficiently.
    Recent advances in artificial intelligence present an opportunity to enhance traditional LMS
    platforms by making them adaptive, personalized, and more supportive of both students and
    instructors. The goal of this project is to design and implement an AI-powered learning
    management system that actively supports learning through intelligent assistance, personalized
    learning paths, and instructor-focused AI tools.
# Setup Instructions
1. Clone the repository
    git clone <your-repo-url>
    cd foundation-lms/backend

2. Create a Virtual Environment
    python -m venv venv
    source venv/bin/activate  # Linux/Mac
    venv\Scripts\activate     # Windows

3. Install Dependencies
    pip install -r requirements.txt

4. Set environment variables (optional, for JWT secret, database path)
    export FLASK_APP=app.py
    export FLASK_ENV=development
    export JWT_SECRET_KEY=<your-secret-key>

# Technologies Used
**Backend**: Flask, SQLAlchemy
**Database**: SQLite (or PostgreSQL for production)
**Authentication**: JWT (JSON Web Tokens)
**Data Analysis**: Python standard libraries (collections, datetime, etc.)
**Frontend**: React.js (to be integrated in next phase)

# Database Configuration
Default SQLite configuration:
File: foundations_lms.db
Location: backend/ directory

# Running the Flask Server
1. Activate the virtual environment (if not already active)
    source venv/bin/activate  # Linux/Mac
    venv\Scripts\activate     # Windows
2. Run database migrations (if using Flask-Migrate)
    flask db upgrade
3. Start the server
    flask run

## Access the API
    By default, the backend will run at: http://127.0.0.1:5001/
    Example endpoint: GET /quiz_attempts/<attempt_id>/quiz_attempt_analytics