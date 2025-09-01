from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:sa@localhost:5432/studio_reform'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1NjQ4NTc3MSwianRpIjoiYmVlYTQ2NDEtZjZlMi00N2NlLTk2ZDktNWMwMThhZWI5MDcyIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6MiwibmJmIjoxNzU2NDg1NzcxLCJjc3JmIjoiYWJkM2VjN2ItYzAyMS00MjU5LWEwNTUtODBkMGQ0NzYwYWE2IiwiZXhwIjoxNzU2NTcyMTcxfQ.0ODjwirOlTjurzaF9bbn5HqszIpCvxxfGVqZK71thII')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
db = SQLAlchemy(app)
cors = CORS(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    schedules = db.relationship('ClassSchedule', backref='class_info', lazy=True)
    bookings = db.relationship('Booking', backref='class_info', lazy=True)

class ClassSchedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
    day_of_week = db.Column(db.String(10), nullable=False)  # Monday, Tuesday, etc.
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
    booking_date = db.Column(db.Date, nullable=False)
    booking_time = db.Column(db.Time, nullable=False)
    status = db.Column(db.String(20), default='Confirmed')  # Confirmed, Cancelled, Waitlist
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    subject = db.Column(db.String(100))
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='New')  # New, Read, Responded
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ChatHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), nullable=False)
    user_message = db.Column(db.Text, nullable=False)
    bot_response = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

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
            is_admin=True   # 👈 Force admin
        )

        db.session.add(admin)
        db.session.commit()

        access_token = create_access_token(identity=admin.id)

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
            membership_plan=data.get('membership_plan', 'Starter')
        )
        is_admin=True
        
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'membership_plan': user.membership_plan
            }
        }), 201
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(email=data['email']).first()
        
        if user and bcrypt.check_password_hash(user.password_hash, data['password']):
            access_token = create_access_token(identity=user.id)
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
                'image': class_item.image_url,
                'schedule': schedule_data
            })
        
        return jsonify(classes_data), 200
        
    except Exception as e:
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
        return jsonify({'message': str(e)}), 500

# Booking Routes
@app.route('/api/bookings', methods=['POST'])
@jwt_required()
def create_booking():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Check if class exists and has capacity
        class_item = Class.query.get(data['class_id'])
        if not class_item:
            return jsonify({'message': 'Class not found'}), 404
        
        # Count current bookings for this class and date
        booking_date = datetime.strptime(data['booking_date'], '%Y-%m-%d').date()
        booking_time = datetime.strptime(data['booking_time'], '%H:%M').time()
        
        current_bookings = Booking.query.filter_by(
            class_id=data['class_id'],
            booking_date=booking_date,
            booking_time=booking_time,
            status='Confirmed'
        ).count()
        
        status = 'Confirmed' if current_bookings < class_item.capacity else 'Waitlist'
        
        booking = Booking(
            user_id=current_user_id,
            class_id=data['class_id'],
            booking_date=booking_date,
            booking_time=booking_time,
            status=status
        )
        
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({
            'message': f'Booking {status.lower()}',
            'booking_id': booking.id,
            'status': status
        }), 201
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

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
        return jsonify({'message': str(e)}), 500

# Contact Routes
@app.route('/api/contact', methods=['POST'])
def submit_contact():
    try:
        data = request.get_json()
        
        contact = Contact(
            name=data['name'],
            email=data['email'],
            phone=data.get('phone', ''),
            subject=data.get('subject', ''),
            message=data['message']
        )
        
        db.session.add(contact)
        db.session.commit()
        
        return jsonify({'message': 'Message sent successfully'}), 201
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# Chatbot Routes
@app.route('/api/chatbot', methods=['POST'])
def chatbot_response():
    try:
        data = request.get_json()
        user_message = data['message']
        session_id = data.get('session_id', 'anonymous')
        
        # Simple chatbot logic (you can enhance this with AI/ML)
        bot_response = get_bot_response(user_message)
        
        # Save chat history
        chat_history = ChatHistory(
            session_id=session_id,
            user_message=user_message,
            bot_response=bot_response
        )
        
        db.session.add(chat_history)
        db.session.commit()
        
        return jsonify({
            'response': bot_response,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
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
            booking_date=datetime.utcnow().date(),
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
                'revenue_mtd': 18450  # This would be calculated from actual payment data
            },
            'recent_bookings': bookings_data
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/admin/members', methods=['GET'])
# @jwt_required()
def get_all_members():
    try:
        # current_user_id = get_jwt_identity()
        # user = User.query.get(current_user_id)
        
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
        return jsonify({'message': str(e)}), 500

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
                    'description': 'First-time intro to the reformer. Breath, alignment, basics.',
                    'image_url': 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800'
                },
                {
                    'name': 'Level 1 - Fundamentals',
                    'instructor': 'Alex Thompson',
                    'duration': '50 min',
                    'difficulty': 'Beginner',
                    'capacity': 8,
                    'description': 'Beginner sequences. Build strength, control, and flow.',
                    'image_url': 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800'
                },
                {
                    'name': 'Level 1.5 - Transitional',
                    'instructor': 'Jordan Williams',
                    'duration': '55 min',
                    'difficulty': 'Intermediate',
                    'capacity': 8,
                    'description': 'Bridge to advanced. More flow, props, and challenge.',
                    'image_url': 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800'
                },
                {
                    'name': 'Level 2 - Advanced',
                    'instructor': 'Taylor Davis',
                    'duration': '55 min',
                    'difficulty': 'Advanced',
                    'capacity': 6,
                    'description': 'Complex, powerful sequences for confident movers.',
                    'image_url': 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800'
                },
                {
                    'name': 'Private - 1:1 Training',
                    'instructor': 'Available Instructors',
                    'duration': '50 min',
                    'difficulty': 'All Levels',
                    'capacity': 1,
                    'description': 'Personalized training tailored to your goals.',
                    'image_url': 'https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=800'
                }
            ]
            
            for class_data in sample_classes:
                new_class = Class(**class_data)
                db.session.add(new_class)
            
            db.session.commit()
        
        create_tables.called = True

if __name__ == '__main__':
    app.run(debug=True, port=5000)