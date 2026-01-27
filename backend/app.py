from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_bcrypt import Bcrypt
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv
import logging
from sqlalchemy import text
import random
import string
from twilio.rest import Client 

# Set up logging
# logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)


  
# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
# app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:sa@localhost:5432/Studio_Reform_New'
# app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://marche_db_user:4zvWz3FKqHRanQNF7zeQ8BIaBLyBCiC9@dpg-d3r62dodl3ps73celsmg-a.oregon-postgres.render.com/marche_db'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://marche_db_9wla_user:f52t6PxlctvwN5NSzS55Qwvq0sFGb08O@dpg-d5j2a51r0fns738dfg6g-a.oregon-postgres.render.com/marche_db_9wla'


app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)


# Twilio Configuration - SIMPLIFIED
app.config['TWILIO_ACCOUNT_SID'] = os.getenv('TWILIO_ACCOUNT_SID')
app.config['TWILIO_AUTH_TOKEN'] = os.getenv('TWILIO_AUTH_TOKEN')
app.config['TWILIO_PHONE_NUMBER'] = os.getenv('TWILIO_PHONE_NUMBER')
app.config['ADMIN_PHONE_NUMBER'] = os.getenv('ADMIN_PHONE_NUMBER')
app.config['TWILIO_MESSAGING_SERVICE_SID'] = os.getenv('TWILIO_MESSAGING_SERVICE_SID')






# Initialize extensions
db = SQLAlchemy(app)
# cors = CORS(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# Configure CORS properly - UPDATEDCORS(app,
# @app.after_request
# def add_cors_headers(resp):
#     allowed_origins = [
#         "http://localhost:5173",
#         "http://127.0.0.1:5173",
#         "https://studio-reform.onrender.com",
#         "https://studio-reform-1.onrender.com",
#         "https://www.studioreform.fit",
        
#     ]
    
#     origin = request.headers.get("Origin")
#     if origin in allowed_origins:
#         resp.headers["Access-Control-Allow-Origin"] = origin
    
#     resp.headers["Access-Control-Allow-Credentials"] = "true"
#     resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization,X-Requested-With"
#     resp.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
#     return resp


# Initialize Twilio client
# Initialize Twilio client - USING MESSAGING SERVICE
# Initialize Twilio client
twilio_client = None
try:
    if all([app.config.get('TWILIO_ACCOUNT_SID'), 
             app.config.get('TWILIO_AUTH_TOKEN'),
             app.config.get('TWILIO_MESSAGING_SERVICE_SID')]):
        
        twilio_client = Client(app.config['TWILIO_ACCOUNT_SID'], 
                               app.config['TWILIO_AUTH_TOKEN'])
        
        # Test connection quietly
        account = twilio_client.api.accounts(app.config['TWILIO_ACCOUNT_SID']).fetch()
        print(f"✅ Twilio initialized")
        
    else:
        missing = []
        if not app.config.get('TWILIO_ACCOUNT_SID'): missing.append('TWILIO_ACCOUNT_SID')
        if not app.config.get('TWILIO_AUTH_TOKEN'): missing.append('TWILIO_AUTH_TOKEN')
        if not app.config.get('TWILIO_MESSAGING_SERVICE_SID'): missing.append('TWILIO_MESSAGING_SERVICE_SID')
        print(f"❌ Twilio credentials incomplete. Missing: {missing}")
        twilio_client = None
        
except Exception as e:
    print(f"❌ Twilio initialization failed: {e}")
    twilio_client = None

# Configure CORS properly - UPDATED
CORS(app, 
     resources={r"/api/*": {"origins": [
         "http://localhost:5173",
         "http://127.0.0.1:5173",
         "https://studio-reform.onrender.com",
         "https://studio-reform-1.onrender.com",
         "https://www.studioreform.fit",
     ]}},
     supports_credentials=True)

@app.after_request
def add_cors_headers(resp):
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://studio-reform.onrender.com",
        "https://studio-reform-1.onrender.com",
        "https://www.studioreform.fit",
    ]
    
    origin = request.headers.get("Origin")
    if origin in allowed_origins:
        resp.headers["Access-Control-Allow-Origin"] = origin
    
    resp.headers["Access-Control-Allow-Credentials"] = "true"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization,X-Requested-With"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return resp

# # Manual CORS handling for preflight requests
# @app.before_request
# def handle_preflight():
#     if request.method == "OPTIONS":
#         response = jsonify({"status": "success"})
#         response.headers.add("Access-Control-Allow-Origin", request.headers.get("Origin", "*"))
#         response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With")
#         response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
#         response.headers.add("Access-Control-Allow-Credentials", "true")
#         response.headers.add("Access-Control-Max-Age", "86400")  # 24 hours
#         return response, 200

# @app.after_request
# def after_request(response):
#     origin = request.headers.get('Origin')
#     allowed_origins = [
#         "https://studio-reform.onrender.com",
#         "https://studio-reform-1.onrender.com", 
#         "http://localhost:5173",
#         "http://127.0.0.1:5173"
#     ]
    
#     if origin in allowed_origins:
#         response.headers.add('Access-Control-Allow-Origin', origin)
#     response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
#     response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
#     response.headers.add('Access-Control-Allow-Credentials', 'true')
#     return response



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
    __tablename__ = 'SrUsers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    password_hash = db.Column(db.String(128))
    membership_plan = db.Column(db.String(50))
    is_admin = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='Active')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # REMOVE THIS LINE - it's causing the conflict
    # bookings = db.relationship('Booking', backref='user', lazy=True)

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
    # REMOVE THIS LINE - it's causing the conflict
    # bookings = db.relationship('Booking', backref='class_info', lazy=True)

class ClassSchedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
    day_of_week = db.Column(db.String(10), nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('SrUsers.id'), nullable=False)
    
    # For class bookings
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=True)
    booking_date = db.Column(db.Date, nullable=True)
    booking_time = db.Column(db.Time, nullable=True)
    
    # For membership packages
    package_type = db.Column(db.String(50), nullable=True)  # 'intro-1', 'private-3', etc.
    package_sessions = db.Column(db.Integer, nullable=True)  # Number of sessions
    package_validity_days = db.Column(db.Integer, nullable=True)  # Validity in days
    
    # Common fields
    booking_type = db.Column(db.String(20), nullable=False)  # 'class', 'membership'
    reference_number = db.Column(db.String(50), unique=True, nullable=False)
    amount = db.Column(db.Integer, nullable=False, default=0)  # Amount in Gambian Dalasi
    status = db.Column(db.String(30), default='pending')  # pending, confirmed, cancelled, completed
    payment_method = db.Column(db.String(20), nullable=True)  # wave, bank, cash
    payment_status = db.Column(db.String(30), default='pending')  # pending, paid, failed
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    confirmed_at = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships - Define them only in one place
    user = db.relationship('User', backref='bookings')
    class_info = db.relationship('Class', backref='bookings')

    def to_dict(self):
        """Convert booking to dictionary for API responses"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'booking_type': self.booking_type,
            'reference_number': self.reference_number,
            'amount': self.amount,
            'status': self.status,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'created_at': self.created_at.isoformat(),
            'user_name': self.user.name if self.user else None
        }
        
        if self.booking_type == 'class':
            data.update({
                'class_id': self.class_id,
                'class_name': self.class_info.name if self.class_info else None,
                'booking_date': self.booking_date.isoformat() if self.booking_date else None,
                'booking_time': self.booking_time.strftime('%H:%M') if self.booking_time else None,
                'instructor': self.class_info.instructor if self.class_info else None
            })
        elif self.booking_type == 'membership':
            data.update({
                'package_type': self.package_type,
                'package_sessions': self.package_sessions,
                'package_validity_days': self.package_validity_days
            })
            
        return data

class PackageConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    package_id = db.Column(db.String(50), unique=True, nullable=False)  # 'intro-1', 'private-3'
    name = db.Column(db.String(100), nullable=False)  # '1 Session', '3 Sessions'
    category = db.Column(db.String(50), nullable=False)  # 'Intro Pack', 'PRIVATE'
    price = db.Column(db.Integer, nullable=False)  # Amount in GMD
    sessions = db.Column(db.Integer, nullable=False)  # Number of sessions
    validity_days = db.Column(db.Integer, nullable=False)  # Validity in days
    is_active = db.Column(db.Boolean, default=True)
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



# ===========================================================================================



# SMS Utility Functions
# ============================================
# SMS Utility Functions - ADD THIS SECTION
# ============================================
def send_sms(to_phone, message):
    """Send SMS using Twilio Messaging Service"""
    if not twilio_client:
        return False
    
    try:
        messaging_service_sid = app.config.get('TWILIO_MESSAGING_SERVICE_SID')
        if not messaging_service_sid:
            return False
        
        # Format phone number
        if not to_phone:
            return False
        
        if not to_phone.startswith('+'):
            if to_phone.startswith('220'):
                to_phone = f'+{to_phone}'
            elif to_phone.startswith('0'):
                to_phone = f'+220{to_phone[1:]}'
            elif len(to_phone) == 7:
                to_phone = f'+220{to_phone}'
        
        # Send SMS
        sent_message = twilio_client.messages.create(
            messaging_service_sid=messaging_service_sid,
            body=message,
            to=to_phone
        )
        
        return True
        
    except Exception as e:
        print(f"SMS failed: {str(e)}")
        return False

def send_payment_confirmation_sms(user, booking, payment_method):
    """Send payment confirmation SMS to customer"""
    try:
        if not user.phone:
            return False
        
        if booking.booking_type == 'membership':
            package_type = booking.package_type.replace('-', ' ').title()
            details = f"{package_type} Package - D{booking.amount}"
        else:
            class_info = Class.query.get(booking.class_id)
            class_name = class_info.name if class_info else "Class"
            details = f"{class_name} - D{booking.amount}"
        
        message = f"""✅ Studio Reform Payment Confirmation
        
Reference: {booking.reference_number}
Type: {booking.booking_type.title()}
Details: {details}
Payment Method: {payment_method}
Amount: D{booking.amount}
Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}

Your booking is pending admin approval.
Thank you!"""
        
        return send_sms(user.phone, message)
        
    except Exception as e:
        print(f"Payment confirmation SMS error: {str(e)}")
        return False

def send_admin_notification_sms(booking, user):
    """Send notification SMS to admin"""
    try:
        admin_number = app.config['ADMIN_PHONE_NUMBER']
        if not admin_number:
            return False
        
        if booking.booking_type == 'membership':
            package_type = booking.package_type.replace('-', ' ').title()
            details = f"{package_type} Package - D{booking.amount}"
        else:
            class_info = Class.query.get(booking.class_id)
            class_name = class_info.name if class_info else "Class"
            details = f"{class_name} - D{booking.amount}"
        
        message = f"""📋 New Payment Received
        
Customer: {user.name}
Phone: {user.phone}
Reference: {booking.reference_number}
Type: {booking.booking_type.title()}
Details: {details}
Amount: D{booking.amount}
Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}

Status: Pending Approval"""
        
        return send_sms(admin_number, message)
        
    except Exception as e:
        print(f"Admin notification SMS error: {str(e)}")
        return False

def send_approval_notification_sms(user, booking):
    """Send SMS when booking is approved"""
    try:
        if booking.booking_type == 'membership':
            package_type = booking.package_type.replace('-', ' ').title()
            details = f"{package_type} Package ({booking.package_sessions} sessions)"
            validity = f"Valid for {booking.package_validity_days} days"
        else:
            class_info = Class.query.get(booking.class_id)
            class_name = class_info.name if class_info else "Class"
            details = f"{class_name}"
            booking_date = booking.booking_date.strftime('%Y-%m-%d') if booking.booking_date else "N/A"
            booking_time = booking.booking_time.strftime('%H:%M') if booking.booking_time else "N/A"
            validity = f"{booking_date} at {booking_time}"
        
        message = f"""🎉 Studio Reform Booking Approved!
        
Reference: {booking.reference_number}
Type: {booking.booking_type.title()}
Details: {details}
{validity}
Amount Paid: D{booking.amount}
Status: ✅ Active

Welcome to Studio Reform!"""
        
        return send_sms(user.phone, message)
        
    except Exception as e:
        print(f"Approval notification SMS error: {str(e)}")
        return False

# ===========================================================================================
@app.route('/api/test-sms-system', methods=['GET'])
def test_sms_system():
    """Test the entire SMS system"""
    try:
        if not twilio_client:
            return jsonify({
                'success': False,
                'message': 'Twilio client not initialized',
                'status': 'NOT_READY'
            }), 500
        
        admin_number = app.config['ADMIN_PHONE_NUMBER']
        twilio_number = app.config['TWILIO_PHONE_NUMBER']
        
        # Test 1: Send test SMS
        test_message = f"""🔧 Studio Reform SMS System Test
        
From: {twilio_number}
To: {admin_number}
Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

This is a test of the SMS notification system.
If you receive this, payment notifications will work!"""
        
        sent_message = twilio_client.messages.create(
            from_=twilio_number,
            body=test_message,
            to=admin_number
        )
        
        return jsonify({
            'success': True,
            'message': '✅ SMS system test sent successfully!',
            'status': 'WORKING',
            'details': {
                'message_sid': sent_message.sid,
                'status': sent_message.status,
                'from': sent_message.from_,
                'to': sent_message.to,
                'twilio_initialized': True
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'status': 'FAILED',
            'config': {
                'twilio_number': app.config.get('TWILIO_PHONE_NUMBER'),
                'admin_number': app.config.get('ADMIN_PHONE_NUMBER'),
                'twilio_client_exists': twilio_client is not None
            }
        }), 500

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



def generate_reference_number():
    prefix = 'STUDIOREFORM'
    timestamp = datetime.now().strftime('%d%H%M%S')
    random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}-{timestamp}-{random_chars}"

# @app.route('/api/bookings', methods=['POST'])
# @jwt_required()
# def create_booking():
#     try:
#         current_user_id = get_jwt_identity()
#         data = request.get_json()
        
#         logger.debug('Booking request from user %s: %s', current_user_id, data)

#         if not data:
#             return jsonify({'message': 'No JSON received'}), 400

#         # Generate reference number
#         reference_number = generate_reference_number()
        
#         booking_data = {
#             'user_id': current_user_id,
#             'reference_number': reference_number,
#             'status': 'pending',
#             'payment_status': 'pending'
#         }
        
#         booking_type = data.get('booking_type', 'class')  # Default to class booking
        
#         if booking_type == 'class':
#             # Class booking logic
#             required_fields = ['class_id', 'booking_date', 'booking_time']
#             for field in required_fields:
#                 if field not in data:
#                     return jsonify({'message': f'Missing field: {field}'}), 400

#             # Validate class_id is an integer
#             try:
#                 class_id = int(data['class_id'])
#                 if class_id <= 0:
#                     return jsonify({'message': 'Invalid class ID'}), 400
#             except (ValueError, TypeError):
#                 return jsonify({'message': 'Class ID must be a number'}), 400

#             # Parse booking date/time
#             try:
#                 booking_date = datetime.strptime(data['booking_date'], '%Y-%m-%d').date()
#                 booking_time = datetime.strptime(data['booking_time'], '%H:%M').time()
#             except ValueError:
#                 return jsonify({'message': 'Invalid date or time format. Use YYYY-MM-DD and HH:MM'}), 400

#             # Check if user already has a booking for this class at this time
#             existing_booking = Booking.query.filter_by(
#                 user_id=current_user_id,
#                 class_id=class_id,
#                 booking_date=booking_date,
#                 booking_time=booking_time
#             ).first()
            
#             if existing_booking:
#                 return jsonify({'message': 'You already have a booking for this class at this time'}), 400

#             # For demo purposes, use default capacity
#             default_capacity = 8
#             current_bookings = Booking.query.filter_by(
#                 class_id=class_id,
#                 booking_date=booking_date,
#                 booking_time=booking_time,
#                 status='confirmed'
#             ).count()

#             status = 'confirmed' if current_bookings < default_capacity else 'waitlist'

#             booking_data.update({
#                 'booking_type': 'class',
#                 'class_id': class_id,
#                 'booking_date': booking_date,
#                 'booking_time': booking_time,
#                 'status': status,
#                 'amount': 0  # Classes might be free or have different pricing
#             })
            
#         elif booking_type == 'membership':
#             # Membership package booking
#             package_id = data.get('package_id')
#             if not package_id:
#                 return jsonify({'message': 'Missing package_id for membership booking'}), 400
                
#             # In a real app, you'd fetch package details from PackageConfig
#             # For now, we'll use a simple mapping
#             package_prices = {
#                 'intro-1': 800, 'intro-3': 2200, 'intro-5': 3500, 'intro-10': 6500, 'intro-unlimited': 12000,
#                 'private-1': 2500, 'private-3': 7000, 'private-5': 11000, 'private-10': 20000
#             }
            
#             package_sessions = {
#                 'intro-1': 1, 'intro-3': 3, 'intro-5': 5, 'intro-10': 10, 'intro-unlimited': 999,
#                 'private-1': 1, 'private-3': 3, 'private-5': 5, 'private-10': 10
#             }
            
#             package_validity = {
#                 'intro-1': 30, 'intro-3': 42, 'intro-5': 60, 'intro-10': 90, 'intro-unlimited': 30,
#                 'private-1': 30, 'private-3': 42, 'private-5': 60, 'private-10': 90
#             }
            
#             if package_id not in package_prices:
#                 return jsonify({'message': 'Invalid package ID'}), 400
                
#             booking_data.update({
#                 'booking_type': 'membership',
#                 'package_type': package_id,
#                 'package_sessions': package_sessions.get(package_id, 1),
#                 'package_validity_days': package_validity.get(package_id, 30),
#                 'amount': package_prices.get(package_id, 0),
#                 'status': 'pending'  # Membership bookings need payment confirmation
#             })
            
#         else:
#             return jsonify({'message': 'Invalid booking type'}), 400

#         # Create the booking
#         booking = Booking(**booking_data)
#         db.session.add(booking)
#         db.session.commit()

#         logger.debug('Booking created successfully with ID: %s', booking.id)
        
#         return jsonify({
#             'message': f'Booking created successfully',
#             'booking_id': booking.id,
#             'reference_number': reference_number,
#             'status': booking.status,
#             'booking_type': booking_type
#         }), 201

#     except Exception as e:
#         db.session.rollback()
#         logger.error('Booking creation failed: %s', str(e))
#         return jsonify({'message': f'Booking failed: {str(e)}'}), 500

# ============================================
@app.route('/api/bookings', methods=['POST'])
@jwt_required()
def create_booking():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        logger.debug('Booking request from user %s: %s', current_user_id, data)

        if not data:
            return jsonify({'message': 'No JSON received'}), 400

        # Generate reference number
        reference_number = generate_reference_number()
        
        booking_data = {
            'user_id': current_user_id,
            'reference_number': reference_number,
            'status': 'pending',
            'payment_status': 'pending'
        }
        
        booking_type = data.get('booking_type', 'class')  # Default to class booking
        
        if booking_type == 'class':
            # Class booking logic (unchanged)
            # ... (keep existing class booking logic)
            # Class booking logic
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
                status='confirmed'
            ).count()

            status = 'confirmed' if current_bookings < default_capacity else 'waitlist'

            booking_data.update({
                'booking_type': 'class',
                'class_id': class_id,
                'booking_date': booking_date,
                'booking_time': booking_time,
                'status': status,
                'amount': 0  # Classes might be free or have different pricing
            })
            
        elif booking_type == 'membership':
            # Membership package booking - MODIFIED FOR ADMIN APPROVAL
            package_id = data.get('package_id')
            if not package_id:
                return jsonify({'message': 'Missing package_id for membership booking'}), 400
                
            # Package mappings
            package_prices = {
                'intro-1': 800, 'intro-3': 2200, 'intro-5': 3500, 'intro-10': 6500, 'intro-unlimited': 12000,
                'private-1': 2500, 'private-3': 7000, 'private-5': 11000, 'private-10': 20000
            }
            
            package_sessions = {
                'intro-1': 1, 'intro-3': 3, 'intro-5': 5, 'intro-10': 10, 'intro-unlimited': 999,
                'private-1': 1, 'private-3': 3, 'private-5': 5, 'private-10': 10
            }
            
            package_validity = {
                'intro-1': 30, 'intro-3': 42, 'intro-5': 60, 'intro-10': 90, 'intro-unlimited': 30,
                'private-1': 30, 'private-3': 42, 'private-5': 60, 'private-10': 90
            }
            
            if package_id not in package_prices:
                return jsonify({'message': 'Invalid package ID'}), 400
                
            booking_data.update({
                'booking_type': 'membership',
                'package_type': package_id,
                'package_sessions': package_sessions.get(package_id, 1),
                'package_validity_days': package_validity.get(package_id, 30),
                'amount': package_prices.get(package_id, 0),
                'status': 'pending_payment',  # Start with pending_payment
                'payment_status': 'pending'
            })
            
        else:
            return jsonify({'message': 'Invalid booking type'}), 400

        # Create the booking
        booking = Booking(**booking_data)
        db.session.add(booking)
        db.session.commit()

        logger.debug('Booking created successfully with ID: %s', booking.id)
        
        return jsonify({
            'message': f'Booking created successfully',
            'booking_id': booking.id,
            'reference_number': reference_number,
            'status': booking.status,
            'booking_type': booking_type
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error('Booking creation failed: %s', str(e))
        return jsonify({'message': f'Booking failed: {str(e)}'}), 500

@app.route('/api/admin/membership-bookings', methods=['GET'])
@jwt_required()
def get_membership_bookings_admin():
    """Get all membership bookings for admin review"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        # Get membership bookings
        bookings = db.session.query(Booking, User).join(User).filter(
            Booking.booking_type == 'membership'
        ).order_by(Booking.created_at.desc()).all()
        
        bookings_data = []
        
        for booking, user_obj in bookings:
            booking_dict = {
                'id': booking.id,
                'user_id': booking.user_id,
                'user_name': user_obj.name,
                'user_email': user_obj.email,
                'reference_number': booking.reference_number,
                'package_type': booking.package_type,
                'package_sessions': booking.package_sessions,
                'package_validity_days': booking.package_validity_days,
                'amount': booking.amount,
                'status': booking.status,
                'payment_method': booking.payment_method,
                'payment_status': booking.payment_status,
                'created_at': booking.created_at.isoformat(),
                'confirmed_at': booking.confirmed_at.isoformat() if booking.confirmed_at else None
            }
            
            bookings_data.append(booking_dict)
        
        return jsonify(bookings_data), 200
        
    except Exception as e:
        logger.error('Get membership bookings error: %s', str(e))
        return jsonify({'message': str(e)}), 500

# @app.route('/api/admin/bookings/<int:booking_id>/approve', methods=['POST'])
# @jwt_required()
# def approve_membership_booking(booking_id):
#     """Admin approves a membership booking"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(int(current_user_id))
        
#         if not user or not user.is_admin:
#             return jsonify({'message': 'Admin access required'}), 403
        
#         booking = Booking.query.get(booking_id)
#         if not booking:
#             return jsonify({'message': 'Booking not found'}), 404
            
#         if booking.booking_type != 'membership':
#             return jsonify({'message': 'Only membership bookings can be approved'}), 400
            
#         if booking.status != 'pending_admin_approval':
#             return jsonify({'message': f'Booking is not pending approval. Current status: {booking.status}'}), 400
        
#         # Approve the booking
#         booking.status = 'active'
#         booking.payment_status = 'verified'
#         booking.confirmed_at = datetime.now(timezone.utc)
        
#         # Update user membership plan if needed
#         user = User.query.get(booking.user_id)
#         if user:
#             # Extract package name for display
#             package_name = booking.package_type.replace('-', ' ').title()
#             user.membership_plan = package_name
        
#         db.session.commit()
        
#         return jsonify({
#             'message': 'Membership booking approved successfully',
#             'booking': {
#                 'id': booking.id,
#                 'status': booking.status,
#                 'reference_number': booking.reference_number,
#                 'user_name': user.name if user else 'Unknown'
#             }
#         }), 200
        
#     except Exception as e:
#         db.session.rollback()
#         logger.error('Approve membership error: %s', str(e))
#         return jsonify({'message': str(e)}), 500

@app.route('/api/admin/bookings/<int:booking_id>/reject', methods=['POST'])
@jwt_required()
def reject_membership_booking(booking_id):
    """Admin rejects a membership booking"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        data = request.get_json()
        reason = data.get('reason', 'No reason provided')
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'message': 'Booking not found'}), 404
            
        if booking.booking_type != 'membership':
            return jsonify({'message': 'Only membership bookings can be rejected'}), 400
            
        if booking.status != 'pending_admin_approval':
            return jsonify({'message': f'Booking is not pending approval. Current status: {booking.status}'}), 400
        
        # Reject the booking
        booking.status = 'rejected'
        booking.payment_status = 'rejected'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Membership booking rejected',
            'reason': reason,
            'booking': {
                'id': booking.id,
                'status': booking.status,
                'reference_number': booking.reference_number
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error('Reject membership error: %s', str(e))
        return jsonify({'message': str(e)}), 500



@app.route('/api/admin/dashboard', methods=['GET'])
@jwt_required()
def admin_dashboard():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        # Get dashboard statistics
        total_members = User.query.filter_by(is_admin=False).count()
        active_classes = Class.query.count()
        
        # Today's bookings
        today = datetime.now(timezone.utc).date()
        today_bookings = Booking.query.filter(
            Booking.booking_date == today,
            Booking.status.in_(['confirmed', 'active'])
        ).count()
        
        # Membership booking stats
        pending_memberships = Booking.query.filter_by(
            booking_type='membership',
            status='pending_admin_approval'
        ).count()
        
        active_memberships = Booking.query.filter_by(
            booking_type='membership',
            status='active'
        ).count()
        
        # Total revenue (sum of all confirmed/active bookings)
        revenue_result = db.session.query(db.func.sum(Booking.amount)).filter(
            Booking.status.in_(['confirmed', 'active']),
            Booking.payment_status.in_(['verified', 'paid'])
        ).first()
        total_revenue = revenue_result[0] if revenue_result[0] else 0
        
        return jsonify({
            'stats': {
                'total_members': total_members,
                'active_classes': active_classes,
                'today_bookings': today_bookings,
                'pending_memberships': pending_memberships,
                'active_memberships': active_memberships,
                'total_revenue': total_revenue
            }
        }), 200
        
    except Exception as e:
        logger.error('Admin dashboard error: %s', str(e))
        return jsonify({'message': str(e)}), 500


@app.route('/api/admin/members/<int:member_id>/assign-class', methods=['POST'])
@jwt_required()
def assign_class_to_member(member_id):
    """Admin assigns a class to a member"""
    try:
        current_user_id = get_jwt_identity()
        admin_user = User.query.get(int(current_user_id))
        
        if not admin_user or not admin_user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        data = request.get_json()
        
        member = User.query.get(member_id)
        if not member:
            return jsonify({'message': 'Member not found'}), 404
        
        # Check if member has active membership
        active_membership = Booking.query.filter_by(
            user_id=member_id,
            booking_type='membership',
            status='active'
        ).first()
        
        if not active_membership:
            return jsonify({'message': 'Member does not have an active membership'}), 400
        
        required_fields = ['class_id', 'booking_date', 'booking_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'Missing field: {field}'}), 400
        
        # Validate class_id
        try:
            class_id = int(data['class_id'])
            class_item = Class.query.get(class_id)
            if not class_item:
                return jsonify({'message': 'Class not found'}), 400
        except (ValueError, TypeError):
            return jsonify({'message': 'Invalid class ID'}), 400
        
        # Parse booking date/time
        try:
            booking_date = datetime.strptime(data['booking_date'], '%Y-%m-%d').date()
            booking_time = datetime.strptime(data['booking_time'], '%H:%M').time()
        except ValueError:
            return jsonify({'message': 'Invalid date or time format. Use YYYY-MM-DD and HH:MM'}), 400
        
        # Check class capacity
        current_bookings = Booking.query.filter_by(
            class_id=class_id,
            booking_date=booking_date,
            booking_time=booking_time,
            status='confirmed'
        ).count()
        
        if current_bookings >= class_item.capacity:
            return jsonify({'message': 'Class is fully booked at this time'}), 400
        
        # Generate reference number
        reference_number = generate_reference_number()
        
        # Create the class booking for the member
        class_booking = Booking(
            user_id=member_id,
            booking_type='class',
            class_id=class_id,
            booking_date=booking_date,
            booking_time=booking_time,
            reference_number=reference_number,
            amount=0,  # Free since they have membership
            status='confirmed',
            payment_method='membership',
            payment_status='paid'
        )
        
        db.session.add(class_booking)
        db.session.commit()
        
        return jsonify({
            'message': f'Class assigned successfully to {member.name}',
            'booking': {
                'id': class_booking.id,
                'reference_number': reference_number,
                'class_name': class_item.name,
                'booking_date': booking_date.isoformat(),
                'booking_time': booking_time.strftime('%H:%M'),
                'member_name': member.name
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error('Assign class error: %s', str(e))
        return jsonify({'message': str(e)}), 500
# ============================================

@app.route('/api/bookings', methods=['GET'])
@jwt_required()
def get_user_bookings():
    try:
        current_user_id = get_jwt_identity()
        bookings = Booking.query.filter_by(user_id=current_user_id).order_by(Booking.created_at.desc()).all()
        
        bookings_data = [booking.to_dict() for booking in bookings]
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

# @app.route('/api/bookings/<int:booking_id>/payment', methods=['POST'])
# @jwt_required()
# def update_payment_status(booking_id):
#     try:
#         current_user_id = get_jwt_identity()
#         data = request.get_json()
        
#         booking = Booking.query.filter_by(id=booking_id, user_id=current_user_id).first()
#         if not booking:
#             return jsonify({'message': 'Booking not found'}), 404
            
#         payment_method = data.get('payment_method')
#         payment_status = data.get('payment_status', 'submitted')
        
#         if not payment_method:
#             return jsonify({'message': 'Payment method is required'}), 400
            
#         # Update payment details
#         booking.payment_method = payment_method
#         booking.payment_status = payment_status
        
#         # For membership bookings, change status to pending_admin_approval
#         if booking.booking_type == 'membership':
#             booking.status = 'pending_admin_approval'
#             # Don't set confirmed_at yet - wait for admin approval
#         else:
#             # For class bookings, auto-confirm
#             booking.status = 'confirmed'
#             booking.confirmed_at = datetime.now(timezone.utc)
        
#         db.session.commit()
        
#         return jsonify({
#             'message': 'Payment submitted successfully. Awaiting admin approval.',
#             'booking': booking.to_dict()
#         }), 200
        
#     except Exception as e:
#         db.session.rollback()
#         logger.error('Payment update error: %s', str(e))
#         return jsonify({'message': str(e)}), 500

# ==============================================================================================


@app.route('/api/bookings/<int:booking_id>/payment', methods=['POST'])
@jwt_required()
def update_payment_status(booking_id):
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        booking = Booking.query.filter_by(id=booking_id, user_id=current_user_id).first()
        if not booking:
            return jsonify({'message': 'Booking not found'}), 404
            
        payment_method = data.get('payment_method')
        payment_status = data.get('payment_status', 'submitted')
        
        if not payment_method:
            return jsonify({'message': 'Payment method is required'}), 400
        
        # Get user details
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Update payment details
        booking.payment_method = payment_method
        booking.payment_status = payment_status
        
        # For membership bookings, change status to pending_admin_approval
        if booking.booking_type == 'membership':
            booking.status = 'pending_admin_approval'
            # Don't set confirmed_at yet - wait for admin approval
        else:
            # For class bookings, auto-confirm
            booking.status = 'confirmed'
            booking.confirmed_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        # Send SMS notifications
        try:
            # Send confirmation to customer
            if user.phone:
                send_payment_confirmation_sms(user, booking, payment_method)
            
            # Send notification to admin
            send_admin_notification_sms(booking, user)
            
        except Exception as sms_error:
            logger.error(f"SMS sending failed: {sms_error}")
            # Don't fail the payment update if SMS fails
        
        return jsonify({
            'message': 'Payment submitted successfully. Awaiting admin approval.',
            'booking': booking.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error('Payment update error: %s', str(e))
        return jsonify({'message': str(e)}), 500

# Update the approve_membership_booking endpoint to send SMS
@app.route('/api/admin/bookings/<int:booking_id>/approve', methods=['POST'])
@jwt_required()
def approve_membership_booking(booking_id):
    """Admin approves a membership booking"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'message': 'Booking not found'}), 404
            
        if booking.booking_type != 'membership':
            return jsonify({'message': 'Only membership bookings can be approved'}), 400
            
        if booking.status != 'pending_admin_approval':
            return jsonify({'message': f'Booking is not pending approval. Current status: {booking.status}'}), 400
        
        # Get customer details
        customer = User.query.get(booking.user_id)
        if not customer:
            return jsonify({'message': 'Customer not found'}), 404
        
        # Approve the booking
        booking.status = 'active'
        booking.payment_status = 'verified'
        booking.confirmed_at = datetime.now(timezone.utc)
        
        # Update user membership plan if needed
        if customer:
            # Extract package name for display
            package_name = booking.package_type.replace('-', ' ').title()
            customer.membership_plan = package_name
        
        db.session.commit()
        
        # Send approval SMS to customer
        try:
            if customer.phone:
                send_approval_notification_sms(customer, booking)
        except Exception as sms_error:
            logger.error(f"Approval SMS sending failed: {sms_error}")
            # Don't fail the approval if SMS fails
        
        return jsonify({
            'message': 'Membership booking approved successfully',
            'booking': {
                'id': booking.id,
                'status': booking.status,
                'reference_number': booking.reference_number,
                'user_name': customer.name if customer else 'Unknown'
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error('Approve membership error: %s', str(e))
        return jsonify({'message': str(e)}), 500

# Add a test SMS endpoint (optional, for debugging)
@app.route('/api/admin/test-sms', methods=['POST'])
@jwt_required()
def test_sms():
    """Test SMS functionality"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        data = request.get_json()
        phone_number = data.get('phone_number')
        message = data.get('message', 'Test SMS from Studio Reform')
        
        if not phone_number:
            return jsonify({'message': 'Phone number is required'}), 400
        
        success = send_sms(phone_number, message)
        
        if success:
            return jsonify({'message': 'Test SMS sent successfully'}), 200
        else:
            return jsonify({'message': 'Failed to send test SMS'}), 500
            
    except Exception as e:
        logger.error(f'Test SMS error: {str(e)}')
        return jsonify({'message': str(e)}), 500


# =============================================================================================



@app.route('/api/packages', methods=['GET'])
def get_packages():
    try:
        packages = [
            # Intro Pack
            {'package_id': 'intro-1', 'name': '1 Session', 'category': 'Intro Pack', 'price': 800, 'sessions': 1, 'validity_days': 30},
            {'package_id': 'intro-3', 'name': '3 Sessions', 'category': 'Intro Pack', 'price': 2200, 'sessions': 3, 'validity_days': 42},
            {'package_id': 'intro-5', 'name': '5 Sessions', 'category': 'Intro Pack', 'price': 3500, 'sessions': 5, 'validity_days': 60},
            {'package_id': 'intro-10', 'name': '10 Sessions', 'category': 'Intro Pack', 'price': 6500, 'sessions': 10, 'validity_days': 90},
            {'package_id': 'intro-unlimited', 'name': 'Monthly Unlimited', 'category': 'Intro Pack', 'price': 12000, 'sessions': 999, 'validity_days': 30},
            # Private Sessions
            {'package_id': 'private-1', 'name': '1 Session', 'category': 'PRIVATE', 'price': 2500, 'sessions': 1, 'validity_days': 30},
            {'package_id': 'private-3', 'name': '3 Sessions', 'category': 'PRIVATE', 'price': 7000, 'sessions': 3, 'validity_days': 42},
            {'package_id': 'private-5', 'name': '5 Sessions', 'category': 'PRIVATE', 'price': 11000, 'sessions': 5, 'validity_days': 60},
            {'package_id': 'private-10', 'name': '10 Sessions', 'category': 'PRIVATE', 'price': 20000, 'sessions': 10, 'validity_days': 90},
        ]
        
        return jsonify(packages), 200
        
    except Exception as e:
        logger.error('Get packages error: %s', str(e))
        return jsonify({'message': str(e)}), 500
# Admin Routes
# @app.route('/api/admin/dashboard', methods=['GET'])
# @jwt_required()
# def admin_dashboard():
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(int(current_user_id))  # Convert to int
        
#         if not user or not user.is_admin:
#             return jsonify({'message': 'Admin access required'}), 403
        
#         # Get dashboard statistics
#         total_members = User.query.filter_by(is_admin=False).count()
#         active_classes = Class.query.count()
#         today_bookings = Booking.query.filter(
#             Booking.booking_date == datetime.now(timezone.utc).date(),
#             Booking.status.in_(['confirmed', 'Confirmed'])
#         ).count()
        
#         # Get recent bookings
#         recent_bookings = db.session.query(Booking, User, Class).join(User).outerjoin(Class).order_by(
#             Booking.created_at.desc()
#         ).limit(10).all()
        
#         bookings_data = []
#         for booking, user_obj, class_item in recent_bookings:
#             booking_data = {
#                 'id': booking.id,
#                 'member': user_obj.name,
#                 'user_name': user_obj.name,
#                 'status': booking.status
#             }
            
#             if class_item:
#                 booking_data.update({
#                     'class': class_item.name,
#                     'class_name': class_item.name,
#                     'time': booking.booking_time.strftime('%I:%M %p') if booking.booking_time else 'N/A'
#                 })
#             else:
#                 booking_data.update({
#                     'class': 'Membership Package',
#                     'class_name': 'Membership Package',
#                     'time': 'N/A'
#                 })
                
#             bookings_data.append(booking_data)
        
#         return jsonify({
#             'stats': {
#                 'total_members': total_members,
#                 'active_classes': active_classes,
#                 'today_bookings': today_bookings,
#                 'revenue_mtd': 18450
#             },
#             'recent_bookings': bookings_data
#         }), 200
        
#     except Exception as e:
#         logger.error('Admin dashboard error: %s', str(e))
#         return jsonify({'message': str(e)}), 500

@app.route('/api/admin/members', methods=['GET'])
@jwt_required()
def get_all_members():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))  # Convert to int
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        members = User.query.filter_by(is_admin=False).all()
        members_data = []
        
        for member in members:
            members_data.append({
                'id': member.id,
                'name': member.name,
                'email': member.email,
                'plan': member.membership_plan,
                'membership_plan': member.membership_plan,
                'status': member.status,
                'joined': member.created_at.strftime('%Y-%m-%d'),
                'created_at': member.created_at.isoformat()
            })
        
        return jsonify(members_data), 200
        
    except Exception as e:
        logger.error('Get members error: %s', str(e))
        return jsonify({'message': str(e)}), 500



# Add these admin routes to your Flask app

@app.route('/api/admin/classes', methods=['GET'])
@jwt_required()
def get_all_classes_admin():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        classes = Class.query.all()
        classes_data = []
        
        for class_item in classes:
            # Get current bookings count for each class
            current_bookings = Booking.query.filter_by(
                class_id=class_item.id,
                status='confirmed'
            ).count()
            
            # Get class schedules
            schedules = ClassSchedule.query.filter_by(class_id=class_item.id).all()
            schedule_data = {}
            
            for schedule in schedules:
                day = schedule.day_of_week
                time_str = f"{schedule.start_time.strftime('%I:%M %p')}"
                if day in schedule_data:
                    schedule_data[day] += f", {time_str}"
                else:
                    schedule_data[day] = time_str
            
            classes_data.append({
                'id': class_item.id,
                'name': class_item.name,
                'instructor': class_item.instructor,
                'duration': class_item.duration,
                'difficulty': class_item.difficulty,
                'capacity': class_item.capacity,
                'current_bookings': current_bookings,
                'available_spots': class_item.capacity - current_bookings,
                'description': class_item.description,
                'image_url': class_item.image_url,
                'schedule': schedule_data,
                'created_at': class_item.created_at.isoformat()
            })
        
        return jsonify(classes_data), 200
        
    except Exception as e:
        logger.error('Get admin classes error: %s', str(e))
        return jsonify({'message': str(e)}), 500

@app.route('/api/admin/bookings', methods=['GET'])
@jwt_required()
def get_all_bookings_admin():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        # Get all bookings with user and class information
        bookings = db.session.query(Booking, User).join(User).order_by(
            Booking.created_at.desc()
        ).all()
        
        bookings_data = []
        
        for booking, user_obj in bookings:
            booking_dict = {
                'id': booking.id,
                'user_id': booking.user_id,
                'user_name': user_obj.name,
                'user_email': user_obj.email,
                'booking_type': booking.booking_type,
                'reference_number': booking.reference_number,
                'amount': booking.amount,
                'status': booking.status,
                'payment_method': booking.payment_method,
                'payment_status': booking.payment_status,
                'created_at': booking.created_at.isoformat(),
                'confirmed_at': booking.confirmed_at.isoformat() if booking.confirmed_at else None,
                'cancelled_at': booking.cancelled_at.isoformat() if booking.cancelled_at else None
            }
            
            if booking.booking_type == 'class':
                class_info = Class.query.get(booking.class_id)
                booking_dict.update({
                    'class_id': booking.class_id,
                    'class_name': class_info.name if class_info else 'Class Not Found',
                    'instructor': class_info.instructor if class_info else 'N/A',
                    'booking_date': booking.booking_date.isoformat() if booking.booking_date else None,
                    'booking_time': booking.booking_time.strftime('%H:%M') if booking.booking_time else None
                })
            elif booking.booking_type == 'membership':
                booking_dict.update({
                    'package_type': booking.package_type,
                    'package_sessions': booking.package_sessions,
                    'package_validity_days': booking.package_validity_days
                })
                
            bookings_data.append(booking_dict)
        
        return jsonify(bookings_data), 200
        
    except Exception as e:
        logger.error('Get admin bookings error: %s', str(e))
        return jsonify({'message': str(e)}), 500

@app.route('/api/admin/bookings/<int:booking_id>/status', methods=['PUT'])
@jwt_required()
def update_booking_status(booking_id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'message': 'Status is required'}), 400
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'message': 'Booking not found'}), 404
        
        # Update status and timestamps
        booking.status = new_status
        if new_status == 'confirmed':
            booking.confirmed_at = datetime.now(timezone.utc)
        elif new_status == 'cancelled':
            booking.cancelled_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Booking status updated successfully',
            'booking': {
                'id': booking.id,
                'status': booking.status,
                'reference_number': booking.reference_number
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error('Update booking status error: %s', str(e))
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
        # Check all tables - updated to include SrUsers
        tables = ['SrUsers', 'class', 'booking', 'contact', 'class_schedule', 'chat_history']
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
        try:
            print("🚀 CHECKING DATABASE TABLES...")
            
            # Test database connection first
            print("🔌 Testing database connection...")
            db.session.execute(text('SELECT 1'))
            print("✅ Database connection successful")
            
            # Check if tables already exist
            print("🔍 Checking existing tables...")
            result = db.session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            existing_tables = [row[0] for row in result]
            print(f"📊 Found existing tables: {existing_tables}")
            
            # Define required tables
            required_tables = ['srusers', 'class', 'booking', 'contact', 'class_schedule', 'chat_history', 'package_config']
            
            # Check which tables are missing
            missing_tables = [table for table in required_tables if table not in existing_tables]
            
            if missing_tables:
                print(f"📝 Creating missing tables: {missing_tables}")
                db.create_all()
                print("✅ Missing tables created")
                
                # Verify tables were created
                result = db.session.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                """))
                tables = [row[0] for row in result]
                print(f"📊 All tables after creation: {tables}")
                
                # Only create sample data if we just created the tables
                if missing_tables:  # If any tables were missing, assume fresh database
                    print("📦 Creating sample classes...")
                    sample_classes = [
                        {
                            'name': 'Root (Classical)',
                            'instructor': 'Studio Reform',
                            'duration': '50 min',
                            'difficulty': 'All Levels',
                            'capacity': 8,
                            'description': 'A return to classical Pilates. Precise, grounded, and methodical — ROOT follows the traditional reformer sequence focusing on control, alignment, and flow.',
                            'image_url': '../images/Foudation.png'
                        },
                        {
                            'name': 'Reform I (Signature, Full Body)',
                            'instructor': 'Studio Reform',
                            'duration': '50 min',
                            'difficulty': 'All Levels',
                            'capacity': 8,
                            'description': 'The signature Studio Reform experience. A full-body reformer flow that merges strength, elongation, and balance.',
                            'image_url': '../images/Foundamental.png'
                        },
                        {
                            'name': 'Reform II (Abs, Booty, Core)',
                            'instructor': 'Studio Reform',
                            'duration': '55 min',
                            'difficulty': 'Intermediate',
                            'capacity': 6,
                            'description': 'The sculpting phase. Focus on the ABC\'s. A focused reformer class targeting abs, booty, and core through deeper resistance and endurance sequences.',
                            'image_url': '../images/transitional.png'
                        },
                        {
                            'name': 'Rhythm (Jumpboard)',
                            'instructor': 'Studio Reform',
                            'duration': '55 min',
                            'difficulty': 'All Levels',
                            'capacity': 6,
                            'description': 'A dynamic reformer flow with jumpboard integration. Low-impact bursts that challenge coordination and control while maintaining form and precision.',
                            'image_url': '../images/advance.png'
                        },
                        {
                            'name': 'Repose (Stretch)',
                            'instructor': 'Studio Reform',
                            'duration': '50 min',
                            'difficulty': 'All Levels',
                            'capacity': 8,
                            'description': 'A restorative reformer experience for elongation, mobility, and release. Focused on breath, flexibility, and tension relief.',
                            'image_url': 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg'
                        },
                        {
                            'name': 'Private Session',
                            'instructor': 'Studio Reform',
                            'duration': '50 min',
                            'difficulty': 'All Levels',
                            'capacity': 1,
                            'description': '1:1 personalized training tailored to your goals. A fully customized session that adapts to your pace, needs, and objectives.',
                            'image_url': 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg'
                        }
                    ]
                    
                    for class_data in sample_classes:
                        # Check if class already exists to avoid duplicates
                        existing_class = Class.query.filter_by(name=class_data['name']).first()
                        if not existing_class:
                            new_class = Class(**class_data)
                            db.session.add(new_class)
                    
                    db.session.commit()
                    print("✅ Sample classes created")
                    
                    # Add sample schedules only for newly created classes
                    print("📅 Creating sample schedules...")
                    sample_schedules = [
                        {'class_name': 'Root (Classical)', 'day_of_week': 'Monday', 'start_time': '07:00', 'end_time': '07:50'},
                        {'class_name': 'Root (Classical)', 'day_of_week': 'Wednesday', 'start_time': '07:00', 'end_time': '07:50'},
                        {'class_name': 'Reform I (Signature, Full Body)', 'day_of_week': 'Tuesday', 'start_time': '08:00', 'end_time': '08:50'},
                        {'class_name': 'Reform I (Signature, Full Body)', 'day_of_week': 'Thursday', 'start_time': '08:00', 'end_time': '08:50'},
                        {'class_name': 'Reform II (Abs, Booty, Core)', 'day_of_week': 'Monday', 'start_time': '17:00', 'end_time': '17:55'},
                        {'class_name': 'Reform II (Abs, Booty, Core)', 'day_of_week': 'Wednesday', 'start_time': '17:00', 'end_time': '17:55'},
                        {'class_name': 'Rhythm (Jumpboard)', 'day_of_week': 'Friday', 'start_time': '16:00', 'end_time': '16:55'},
                        {'class_name': 'Repose (Stretch)', 'day_of_week': 'Sunday', 'start_time': '10:00', 'end_time': '10:50'},
                    ]
                    
                    for schedule_data in sample_schedules:
                        # Find class by name
                        class_item = Class.query.filter_by(name=schedule_data['class_name']).first()
                        if class_item:
                            # Check if schedule already exists
                            existing_schedule = ClassSchedule.query.filter_by(
                                class_id=class_item.id,
                                day_of_week=schedule_data['day_of_week'],
                                start_time=datetime.strptime(schedule_data['start_time'], '%H:%M').time()
                            ).first()
                            
                            if not existing_schedule:
                                start_time = datetime.strptime(schedule_data['start_time'], '%H:%M').time()
                                end_time = datetime.strptime(schedule_data['end_time'], '%H:%M').time()
                                
                                schedule = ClassSchedule(
                                    class_id=class_item.id,
                                    day_of_week=schedule_data['day_of_week'],
                                    start_time=start_time,
                                    end_time=end_time
                                )
                                db.session.add(schedule)
                    
                    db.session.commit()
                    print("✅ Sample schedules created")
                    
                    print("🎉 DATABASE SETUP COMPLETE!")
            else:
                print("✅ All tables already exist - skipping creation")
            
        except Exception as e:
            print(f"❌ DATABASE SETUP FAILED: {e}")
            logger.error(f"Database setup error: {e}")
            db.session.rollback()
            import traceback
            traceback.print_exc()
        
        create_tables.called = True

@app.route('/api/test-db')
def test_db():
    try:
        # Test connection - FIXED with text()
        db.session.execute(text('SELECT 1'))
        
        # Check tables - FIXED with text()
        result = db.session.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """))
        tables = [row[0] for row in result]
        
        return jsonify({
            'status': 'success',
            'database': app.config['SQLALCHEMY_DATABASE_URI'],
            'tables': tables
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'database_uri': app.config['SQLALCHEMY_DATABASE_URI']
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)