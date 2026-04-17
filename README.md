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
    git clone https://github.com/Awo-Nimi-04/foundation-lms
    cd foundation-lms

2. Run Backend
    cd backend
    python -m venv venv
    source venv/bin/activate   # for Mac/Linux
    venv\Scripts\activate      # for Windows

    pip install -r requirements.txt

    # Set environment variables
    export FLASK_APP=app.py
    export DATABASE_URL=your_local_db_url

    # External Services
    + GEMINI_API_KEY=
    + JWT_TOKEN=

    + MAILJET_API_KEY=
    + MAILJET_SECRET_KEY=

    + CLOUDINARY_API_KEY=
    + CLOUDINARY_API_SECRET=
    + CLOUD_NAME=

    If you do not provide the external API keys, the app can still run with limited functionality:

    - AI features (Gemini) will be disabled
    - Email sending (Mailjet) will not work
    - Image uploads (Cloudinary) will not work

    # Run backend
    flask db upgrade
    flask run

3. Run Frontend
    cd frontend
    npm install

    # Create .env file
    VITE_API_URL=http://localhost:5000

    npm run dev

# Technologies Used
**Backend**: Flask, SQLAlchemy
**Database**: SQLite (or PostgreSQL for production)
**Authentication**: JWT (JSON Web Tokens)
**Data Analysis**: Python standard libraries (collections, datetime, etc.)
**Frontend**: React.js + Vite

# Database Configuration
**Local development:**
Default SQLite configuration:
File: foundations_lms.db
Location: backend/ directory

**Production:**
Supabase Postgre SQL

# Running the Flask Server
1. Activate the virtual environment (if not already active)
    source venv/bin/activate  # Linux/Mac
    venv\Scripts\activate     # Windows
2. Run database migrations (if using Flask-Migrate)
    flask db upgrade
3. Start the server
    flask run

## Access the API
    By default, the backend will run locally at: http://127.0.0.1:5001/
    Example endpoint: GET /quiz_attempts/<attempt_id>/quiz_attempt_analytics

    Production API URL: https://foundation-lms.onrender.com/

### Note: Check spam/junk for any emails sent by application; icloud may filter spam emails sent to any icloud accounts

# Professional Conduct and Integrity
ChatGPT was used extensively during the design phase of this project. It was also used for troubleshooting and finetuning analytics algorithms as well as backend requests to the AI model used (Gemini flash 2.5).
