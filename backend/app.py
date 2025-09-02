from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_bcrypt import Bcrypt
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv
import logging

# Set up logging3
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:sa@localhost:5432/Studio_Reform_'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
db = SQLAlchemy(app)
cors = CORS(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# JWT error handlers
@jwt.unauthorized_loader
def unauthorized_callback(callback):
    return jsonify({'message': 'Missing or invalid token'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(callback):
    return jsonify({'message': 'Invalid token'}), 422

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'message': 'Token has expired'}), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    return jsonify({'message': 'Token has been revoked'}), 401

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    password_hash = db.Column(db.String(128))
    membership_plan = db.Column(db.String(50))
    is_admin = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='Active')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    bookings = db.relationship('Booking', backref='user', lazy=True)

class Class(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    instructor = db.Column(db.String(100), nullable=False)
    duration = db.Column(db.String(20), nullable=False)
    difficulty = db.Column(db.String(20), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    schedules = db.relationship('ClassSchedule', backref='class_info', lazy=True)
    bookings = db.relationship('Booking', backref='class_info', lazy=True)

class ClassSchedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
    day_of_week = db.Column(db.String(10), nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
    booking_date = db.Column(db.Date, nullable=False)
    booking_time = db.Column(db.Time, nullable=False)
    status = db.Column(db.String(20), default='Confirmed')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), default='')
    subject = db.Column(db.String(100), default='', nullable=True)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='New')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class ChatHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), nullable=False)
    user_message = db.Column(db.Text, nullable=False)
    bot_response = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

# Request logging
@app.before_request
def log_request_info():
    logger.debug('Headers: %s', dict(request.headers))
    logger.debug('Body: %s', request.get_data(as_text=True))
    logger.debug('Endpoint: %s %s', request.method, request.path)

# Authentication Routes
@app.route('/api/register-admin', methods=['POST'])
def register_admin():
    try:
        data = request.get_json()

        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already registered'}), 400

        password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        admin = User(
            name=data['name'],
            email=data['email'],
            phone=data.get('phone', ''),
            password_hash=password_hash,
            membership_plan="Admin",
            is_admin=True
        )

        db.session.add(admin)
        db.session.commit()

        # Convert ID to string for JWT identity
        access_token = create_access_token(identity=str(admin.id))

        return jsonify({
            'message': 'Admin registered successfully',
            'access_token': access_token,
            'user': {
                'id': admin.id,
                'name': admin.name,
                'email': admin.email,
                'is_admin': admin.is_admin
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error('Admin registration error: %s', str(e))
        return jsonify({'message': str(e)}), 500

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already registered'}), 400
        
        # Create new user
        password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        user = User(
            name=data['name'],
            email=data['email'],
            phone=data.get('phone', ''),
            password_hash=password_hash,
            membership_plan=data.get('membership_plan', 'Starter'),
            is_admin=False
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Convert ID to string for JWT identity
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'membership_plan': user.membership_plan,
                'is_admin': user.is_admin
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error('Registration error: %s', str(e))
        return jsonify({'message': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(email=data['email']).first()
        
        if user and bcrypt.check_password_hash(user.password_hash, data['password']):
            # Convert ID to string for JWT identity
            access_token = create_access_token(identity=str(user.id))
            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'membership_plan': user.membership_plan,
                    'is_admin': user.is_admin
                }
            }), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401
            
    except Exception as e:
        logger.error('Login error: %s', str(e))
        return jsonify({'message': str(e)}), 500

# Classes Routes
@app.route('/api/classes', methods=['GET'])
def get_classes():
    try:
        classes = Class.query.all()
        classes_data = []
        
        for class_item in classes:
            schedules = ClassSchedule.query.filter_by(class_id=class_item.id).all()
            schedule_data = {}
            
            for schedule in schedules:
                day = schedule.day_of_week
                time_str = f"{schedule.start_time.strftime('%I:%M %p')}"
                if day in schedule_data:
                    schedule_data[day] += f", {time_str}"
                else:
                    schedule_data[day] = time_str
            
            # Count current bookings
            current_bookings = Booking.query.filter_by(
                class_id=class_item.id,
                status='Confirmed'
            ).count()
            
            classes_data.append({
                'id': class_item.id,
                'name': class_item.name,
                'instructor': class_item.instructor,
                'duration': class_item.duration,
                'difficulty': class_item.difficulty,
                'capacity': class_item.capacity,
                'enrolled': current_bookings,
                'description': class_item.description,
                'image_url': class_item.image_url,
                'schedule': schedule_data
            })
        
        return jsonify(classes_data), 200
        
    except Exception as e:
        logger.error('Get classes error: %s', str(e))
        return jsonify({'message': str(e)}), 500

@app.route('/api/classes', methods=['POST'])
@jwt_required()
def create_class():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        data = request.get_json()
        
        new_class = Class(
            name=data['name'],
            instructor=data['instructor'],
            duration=data['duration'],
            difficulty=data['difficulty'],
            capacity=data['capacity'],
            description=data.get('description', ''),
            image_url=data.get('image_url', '')
        )
        
        db.session.add(new_class)
        db.session.commit()
        
        return jsonify({'message': 'Class created successfully', 'class_id': new_class.id}), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error('Create class error: %s', str(e))
        return jsonify({'message': str(e)}), 500

# Booking Routes
@app.route('/api/bookings', methods=['POST'])
@jwt_required()
def create_booking():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        logger.debug('Booking request from user %s: %s', current_user_id, data)

        if not data:
            return jsonify({'message': 'No JSON received'}), 400

        required_fields = ['class_id', 'booking_date', 'booking_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'Missing field: {field}'}), 400

        # Validate class_id is an integer
        try:
            class_id = int(data['class_id'])
            if class_id <= 0:
                return jsonify({'message': 'Invalid class ID'}), 400
        except (ValueError, TypeError):
            return jsonify({'message': 'Class ID must be a number'}), 400

        # Parse booking date/time
        try:
            booking_date = datetime.strptime(data['booking_date'], '%Y-%m-%d').date()
            booking_time = datetime.strptime(data['booking_time'], '%H:%M').time()
        except ValueError:
            return jsonify({'message': 'Invalid date or time format. Use YYYY-MM-DD and HH:MM'}), 400

        # Check if user already has a booking for this class at this time
        existing_booking = Booking.query.filter_by(
            user_id=current_user_id,
            class_id=class_id,
            booking_date=booking_date,
            booking_time=booking_time
        ).first()
        
        if existing_booking:
            return jsonify({'message': 'You already have a booking for this class at this time'}), 400

        # For demo purposes, use default capacity
        default_capacity = 8
        current_bookings = Booking.query.filter_by(
            class_id=class_id,
            booking_date=booking_date,
            booking_time=booking_time,
            status='Confirmed'
        ).count()

        status = 'Confirmed' if current_bookings < default_capacity else 'Waitlist'

        # Create the booking
        booking = Booking(
            user_id=current_user_id,
            class_id=class_id,
            booking_date=booking_date,
            booking_time=booking_time,
            status=status
        )

        db.session.add(booking)
        db.session.commit()

        logger.debug('Booking created successfully with ID: %s', booking.id)
        
        return jsonify({
            'message': f'Booking {status.lower()}',
            'booking_id': booking.id,
            'status': status
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error('Booking creation failed: %s', str(e))
        return jsonify({'message': f'Booking failed: {str(e)}'}), 500

@app.route('/api/bookings', methods=['GET'])
@jwt_required()
def get_user_bookings():
    try:
        current_user_id = get_jwt_identity()
        bookings = db.session.query(Booking, Class).join(Class).filter(
            Booking.user_id == current_user_id
        ).all()
        
        bookings_data = []
        for booking, class_item in bookings:
            bookings_data.append({
                'id': booking.id,
                'class_name': class_item.name,
                'instructor': class_item.instructor,
                'booking_date': booking.booking_date.isoformat(),
                'booking_time': booking.booking_time.strftime('%H:%M'),
                'status': booking.status,
                'created_at': booking.created_at.isoformat()
            })
        
        return jsonify(bookings_data), 200
        
    except Exception as e:
        logger.error('Get user bookings error: %s', str(e))
        return jsonify({'message': str(e)}), 500

# Contact Routes
@app.route('/api/contact', methods=['POST'])
def submit_contact():
    try:
        data = request.get_json()
        
        # Ensure subject is always a string
        subject = data.get('subject', '')
        if subject is None:
            subject = ''
        
        contact = Contact(
            name=data['name'],
            email=data['email'],
            phone=data.get('phone', ''),
            subject=subject,
            message=data['message']
        )
        
        db.session.add(contact)
        db.session.commit()
        
        return jsonify({'message': 'Message sent successfully'}), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error('Contact form error: %s', str(e))
        return jsonify({'message': str(e)}), 500

# Chatbot Routes
@app.route('/api/chatbot', methods=['POST'])
def chatbot_response():
    try:
        data = request.get_json()
        user_message = data['message']
        session_id = data.get('session_id', 'anonymous')
        
        bot_response = get_bot_response(user_message)
        
        chat_history = ChatHistory(
            session_id=session_id,
            user_message=user_message,
            bot_response=bot_response
        )
        
        db.session.add(chat_history)
        db.session.commit()
        
        return jsonify({
            'response': bot_response,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        logger.error('Chatbot error: %s', str(e))
        return jsonify({'message': str(e)}), 500

def get_bot_response(message):
    message_lower = message.lower()
    
    if any(word in message_lower for word in ['schedule', 'class', 'time', 'level']):
        return 'We offer reformer Pilates classes from Level 0 (Foundation) to Level 2 (Advanced), plus private 1:1 sessions. Classes run Monday-Friday 7AM-8PM, weekends 8AM-6PM. Small class sizes (6-8 people) ensure personalized attention. Which level interests you?'
    
    elif any(word in message_lower for word in ['price', 'cost', 'membership']):
        return 'Our boutique studio offers flexible membership options for reformer Pilates classes. We focus on quality over quantity with small class sizes. Contact us for current pricing and package options. New members can book a trial class!'
    
    elif any(word in message_lower for word in ['location', 'address', 'where', 'gambia']):
        return 'Studio Reform is located in Banjul, The Gambia - we\'re The Gambia\'s first boutique reformer Pilates studio! We\'re open Monday-Friday 7AM-8PM, and weekends 8AM-6PM. Contact us for exact location details.'
    
    elif any(word in message_lower for word in ['trainer', 'personal', 'private', 'instructor']):
        return 'We offer private 1:1 reformer Pilates sessions tailored to your specific goals and needs. Our certified instructors provide personalized attention for healing, rehabilitation, or advanced training. Would you like to schedule a consultation?'
    
    elif any(word in message_lower for word in ['trial', 'free', 'first time', 'beginner']):
        return 'New to reformer Pilates? Perfect! Start with our Level 0 - Foundation class to learn breath, alignment, and basics. We offer trial classes for newcomers. Our instructors will guide you through every movement safely.'
    
    elif any(word in message_lower for word in ['pilates', 'reformer', 'what is']):
        return 'Reformer Pilates uses a specialized machine with springs and pulleys to provide resistance and support. It focuses on controlled movements, proper alignment, and breath work. Our classes emphasize both healing and transformation, leaving you balanced, strengthened, and renewed.'
    
    else:
        return 'Thanks for your question! For specific inquiries about our reformer Pilates classes, feel free to contact us at +220 123 4567 or info@studioreform.com. We\'re here to help you find your balance and discover your strength. What else can I help with?'

# Admin Routes
@app.route('/api/admin/dashboard', methods=['GET'])
@jwt_required()
def admin_dashboard():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        # Get dashboard statistics
        total_members = User.query.filter_by(is_admin=False).count()
        active_classes = Class.query.count()
        today_bookings = Booking.query.filter_by(
            booking_date=datetime.now(timezone.utc).date(),
            status='Confirmed'
        ).count()
        
        # Get recent bookings
        recent_bookings = db.session.query(Booking, User, Class).join(User).join(Class).order_by(
            Booking.created_at.desc()
        ).limit(10).all()
        
        bookings_data = []
        for booking, user, class_item in recent_bookings:
            bookings_data.append({
                'id': booking.id,
                'member': user.name,
                'class': class_item.name,
                'time': booking.booking_time.strftime('%I:%M %p'),
                'status': booking.status
            })
        
        return jsonify({
            'stats': {
                'total_members': total_members,
                'active_classes': active_classes,
                'today_bookings': today_bookings,
                'revenue_mtd': 18450
            },
            'recent_bookings': bookings_data
        }), 200
        
    except Exception as e:
        logger.error('Admin dashboard error: %s', str(e))
        return jsonify({'message': str(e)}), 500

@app.route('/api/admin/members', methods=['GET'])
@jwt_required()
def get_all_members():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        members = User.query.filter_by(is_admin=False).all()
        members_data = []
        
        for member in members:
            members_data.append({
                'id': member.id,
                'name': member.name,
                'email': member.email,
                'plan': member.membership_plan,
                'status': member.status,
                'joined': member.created_at.strftime('%Y-%m-%d')
            })
        
        return jsonify(members_data), 200
        
    except Exception as e:
        logger.error('Get members error: %s', str(e))
        return jsonify({'message': str(e)}), 500

# Debug endpoints
@app.route('/api/debug/token', methods=['GET'])
@jwt_required()
def debug_token():
    """Debug endpoint to check JWT token"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        return jsonify({
            'user_id': current_user_id,
            'user_id_type': type(current_user_id).__name__,
            'user_exists': user is not None,
            'message': 'Token is valid'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/debug/schema', methods=['GET'])
def debug_schema():
    """Check database schema"""
    try:
        # Check all tables
        tables = ['user', 'class', 'booking', 'contact', 'class_schedule', 'chat_history']
        schema_info = {}
        
        for table in tables:
            try:
                result = db.session.execute(f"""
                    SELECT column_name, data_type, is_nullable 
                    FROM information_schema.columns 
                    WHERE table_name = '{table}'
                    ORDER by ordinal_position
                """)
                schema_info[table] = [dict(row) for row in result]
            except:
                schema_info[table] = f"Table {table} doesn't exist or error querying"
        
        return jsonify(schema_info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'API is working'})

# Initialize database
@app.before_request
def create_tables():
    if not hasattr(create_tables, 'called'):
        db.create_all()
        
        # Create sample data if tables are empty
        if Class.query.count() == 0:
            sample_classes = [
                {
                    'name': 'Level 0 - Foundation',
                    'instructor': 'Alex Thompson',
                    'duration': '50 min',
                    'difficulty': 'Beginner',
                    'capacity': 6,
                    'description': 'Perfect for those who have never done Reformer Pilates before. These sessions introduce you to the Reformer, focusing on breath, alignment, and the most basic movements. It\'s a gentle, slow-paced class designed to build comfort and confidence. No experience needed — just curiosity and a willingness to learn. Clients only need to complete 1 Level 0 class.',
                    'image_url': '../images/Foudation.png'
                },
                {
                    'name': 'Level 1 - Fundamentals',
                    'instructor': 'Alex Thompson',
                    'duration': '50 min',
                    'difficulty': 'Beginner',
                    'capacity': 8,
                    'description': 'Ideal for beginners who are ready to build on the foundation. These classes focus on control, strength, and connecting movement with breath. You\'ll reinforce basic Pilates principles while gaining confidence in the Reformer.',
                    'image_url': '../images/Foundamental.png'
                },
                {
                    'name': 'Level 1.5 - Transitional',
                    'instructor': 'Jordan Williams',
                    'duration': '55 min',
                    'difficulty': 'Intermediate',
                    'capacity': 8,
                    'description': 'Designed for those who feel strong in Level 1, but aren\'t quite ready for the pace and complexity of Level 2. This level bridges the gap by offering a more dynamic flow, increased coordination, and deeper engagement. Props may be introduced for extra challenge. You\'ll know you\'re ready for this level when you crave just a bit more.',
                    'image_url': '../images/transitional.png'
                },
                {
                    'name': 'Level 2 - Advanced',
                    'instructor': 'Taylor Davis',
                    'duration': '55 min',
                    'difficulty': 'Advanced',
                    'capacity': 6,
                    'description': 'For clients who have mastered Reformer Pilates fundamentals and want to take it to the next level. Expect complex sequences, endurance-focused exercises, creative transitions, and powerful flows. Reminder: Just because you\'ve reached Level 2 doesn\'t mean you can\'t return to a lower-level class — revisiting the basics is always a strong choice.',
                    'image_url': '../images/advance.png'
                },
                {
                    'name': 'Private - 1:1 Training',
                    'instructor': 'Available Instructors',
                    'duration': '50 min',
                    'difficulty': 'All Levels',
                    'capacity': 1,
                    'description': '1:1 personalized training tailored to your goals. A fully customized session that adapts to your pace, needs, and objectives.',
                    'image_url': 'https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg'
                }
            ]
            
            for class_data in sample_classes:
                new_class = Class(**class_data)
                db.session.add(new_class)
            
            db.session.commit()
            
            # Add sample schedules
            sample_schedules = [
                {'class_id': 1, 'day_of_week': 'Monday', 'start_time': '07:00', 'end_time': '07:50'},
                {'class_id': 1, 'day_of_week': 'Wednesday', 'start_time': '07:00', 'end_time': '07:50'},
                {'class_id': 1, 'day_of_week': 'Friday', 'start_time': '07:00', 'end_time': '07:50'},
                {'class_id': 2, 'day_of_week': 'Tuesday', 'start_time': '08:00', 'end_time': '08:50'},
                {'class_id': 2, 'day_of_week': 'Thursday', 'start_time': '08:00', 'end_time': '08:50'},
                {'class_id': 3, 'day_of_week': 'Monday', 'start_time': '09:00', 'end_time': '09:55'},
                {'class_id': 3, 'day_of_week': 'Wednesday', 'start_time': '09:00', 'end_time': '09:55'},
                {'class_id': 4, 'day_of_week': 'Tuesday', 'start_time': '10:00', 'end_time': '10:55'},
                {'class_id': 4, 'day_of_week': 'Thursday', 'start_time': '10:00', 'end_time': '10:55'},
                {'class_id': 5, 'day_of_week': 'Monday', 'start_time': '14:00', 'end_time': '14:50'},
                {'class_id': 5, 'day_of_week': 'Tuesday', 'start_time': '14:00', 'end_time': '14:50'},
                {'class_id': 5, 'day_of_week': 'Wednesday', 'start_time': '14:00', 'end_time': '14:50'},
                {'class_id': 5, 'day_of_week': 'Thursday', 'start_time': '14:00', 'end_time': '14:50'},
                {'class_id': 5, 'day_of_week': 'Friday', 'start_time': '14:00', 'end_time': '14:50'},
            ]
            
            for schedule_data in sample_schedules:
                # Convert time strings to time objects
                start_time = datetime.strptime(schedule_data['start_time'], '%H:%M').time()
                end_time = datetime.strptime(schedule_data['end_time'], '%H:%M').time()
                
                schedule = ClassSchedule(
                    class_id=schedule_data['class_id'],
                    day_of_week=schedule_data['day_of_week'],
                    start_time=start_time,
                    end_time=end_time
                )
                db.session.add(schedule)
            
            db.session.commit()
            logger.info("Sample data created successfully")
        
        create_tables.called = True

if __name__ == '__main__':
    app.run(debug=True, port=5000)