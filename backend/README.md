# Studio Reform Backend

Flask backend for Studio Reform fitness studio website.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up PostgreSQL database:
```bash
# Create database
createdb studio_reform

# Update .env file with your database credentials
```

3. Configure environment variables in `.env`:
```
SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_SECRET_KEY=jwt-secret-string-change-this-too
DATABASE_URL=postgresql://username:password@localhost/studio_reform
```

4. Run the application:
```bash
python run.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login

### Classes
- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create new class (admin only)

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create new booking

### Contact
- `POST /api/contact` - Submit contact form

### Chatbot
- `POST /api/chatbot` - Send message to chatbot

### Admin
- `GET /api/admin/dashboard` - Get dashboard data
- `GET /api/admin/members` - Get all members

## Database Schema

The application uses PostgreSQL with the following tables:
- `user` - User accounts and membership info
- `class` - Fitness classes
- `class_schedule` - Class scheduling
- `booking` - Class bookings
- `contact` - Contact form submissions
- `chat_history` - Chatbot conversation history

## Features

- JWT-based authentication
- Role-based access control (admin/user)
- Class booking system
- Contact form handling
- Chatbot with conversation history
- Admin dashboard with analytics
- CORS enabled for frontend integration