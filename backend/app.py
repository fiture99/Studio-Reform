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
# class User(db.Model):
#     __tablename__ = 'SrUsers'
    
#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.String(100), nullable=False)
#     email = db.Column(db.String(120), unique=True, nullable=False)
#     phone = db.Column(db.String(20))
#     password_hash = db.Column(db.String(128))
#     membership_plan = db.Column(db.String(50))
#     is_admin = db.Column(db.Boolean, default=False)
#     status = db.Column(db.String(20), default='Active')
#     created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
#     # REMOVE THIS LINE - it's causing the conflict
#     # bookings = db.relationship('Booking', backref='user', lazy=True)

# class Class(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.String(100), nullable=False)
#     instructor = db.Column(db.String(100), nullable=False)
#     duration = db.Column(db.String(20), nullable=False)
#     difficulty = db.Column(db.String(20), nullable=False)
#     capacity = db.Column(db.Integer, nullable=False)
#     description = db.Column(db.Text)
#     image_url = db.Column(db.String(255))
#     created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
#     schedules = db.relationship('ClassSchedule', backref='class_info', lazy=True)
#     # REMOVE THIS LINE - it's causing the conflict
#     # bookings = db.relationship('Booking', backref='class_info', lazy=True)

# class ClassSchedule(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
#     day_of_week = db.Column(db.String(10), nullable=False)
#     start_time = db.Column(db.Time, nullable=False)
#     end_time = db.Column(db.Time, nullable=False)

# class Booking(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(db.Integer, db.ForeignKey('SrUsers.id'), nullable=False)
    
#     # For class bookings
#     class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=True)
#     booking_date = db.Column(db.Date, nullable=True)
#     booking_time = db.Column(db.Time, nullable=True)
    
#     # For membership packages
#     package_type = db.Column(db.String(50), nullable=True)  # 'intro-1', 'private-3', etc.
#     package_sessions = db.Column(db.Integer, nullable=True)  # Number of sessions
#     package_validity_days = db.Column(db.Integer, nullable=True)  # Validity in days
    
#     # Common fields
#     booking_type = db.Column(db.String(20), nullable=False)  # 'class', 'membership'
#     reference_number = db.Column(db.String(50), unique=True, nullable=False)
#     amount = db.Column(db.Integer, nullable=False, default=0)  # Amount in Gambian Dalasi
#     status = db.Column(db.String(30), default='pending')  # pending, confirmed, cancelled, completed
#     payment_method = db.Column(db.String(20), nullable=True)  # wave, bank, cash
#     payment_status = db.Column(db.String(30), default='pending')  # pending, paid, failed
    
#     # Timestamps
#     created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
#     confirmed_at = db.Column(db.DateTime, nullable=True)
#     cancelled_at = db.Column(db.DateTime, nullable=True)
    
#     # Relationships - Define them only in one place
#     user = db.relationship('User', backref='bookings')
#     class_info = db.relationship('Class', backref='bookings')

#     def to_dict(self):
#         """Convert booking to dictionary for API responses"""
#         data = {
#             'id': self.id,
#             'user_id': self.user_id,
#             'booking_type': self.booking_type,
#             'reference_number': self.reference_number,
#             'amount': self.amount,
#             'status': self.status,
#             'payment_method': self.payment_method,
#             'payment_status': self.payment_status,
#             'created_at': self.created_at.isoformat(),
#             'user_name': self.user.name if self.user else None
#         }
        
#         if self.booking_type == 'class':
#             data.update({
#                 'class_id': self.class_id,
#                 'class_name': self.class_info.name if self.class_info else None,
#                 'booking_date': self.booking_date.isoformat() if self.booking_date else None,
#                 'booking_time': self.booking_time.strftime('%H:%M') if self.booking_time else None,
#                 'instructor': self.class_info.instructor if self.class_info else None
#             })
#         elif self.booking_type == 'membership':
#             data.update({
#                 'package_type': self.package_type,
#                 'package_sessions': self.package_sessions,
#                 'package_validity_days': self.package_validity_days
#             })
            
#         return data

# class PackageConfig(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     package_id = db.Column(db.String(50), unique=True, nullable=False)  # 'intro-1', 'private-3'
#     name = db.Column(db.String(100), nullable=False)  # '1 Session', '3 Sessions'
#     category = db.Column(db.String(50), nullable=False)  # 'Intro Pack', 'PRIVATE'
#     price = db.Column(db.Integer, nullable=False)  # Amount in GMD
#     sessions = db.Column(db.Integer, nullable=False)  # Number of sessions
#     validity_days = db.Column(db.Integer, nullable=False)  # Validity in days
#     is_active = db.Column(db.Boolean, default=True)
#     created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

# class Contact(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.String(100), nullable=False)
#     email = db.Column(db.String(120), nullable=False)
#     phone = db.Column(db.String(20), default='')
#     subject = db.Column(db.String(100), default='', nullable=True)
#     message = db.Column(db.Text, nullable=False)
#     status = db.Column(db.String(20), default='New')
#     created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

# class ChatHistory(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     session_id = db.Column(db.String(100), nullable=False)
#     user_message = db.Column(db.Text, nullable=False)
#     bot_response = db.Column(db.Text, nullable=False)
#     created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


#     # Replace the ClassSlot model with these models

# class WeeklySchedule(db.Model):
#     """Weekly class schedule set by admin"""
#     id = db.Column(db.Integer, primary_key=True)
#     class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
#     day_of_week = db.Column(db.String(10), nullable=False)  # Monday, Tuesday, etc.
#     start_time = db.Column(db.Time, nullable=False)
#     end_time = db.Column(db.Time, nullable=False)
#     max_capacity = db.Column(db.Integer, nullable=False, default=4)
#     is_active = db.Column(db.Boolean, default=True)
#     created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
#     # Relationships
#     class_info = db.relationship('Class', backref='weekly_schedules')
#     schedule_instances = db.relationship('ScheduleInstance', backref='weekly_schedule', lazy=True)

# class ScheduleInstance(db.Model):
#     """Specific date instances generated from weekly schedule"""
#     id = db.Column(db.Integer, primary_key=True)
#     weekly_schedule_id = db.Column(db.Integer, db.ForeignKey('weekly_schedule.id'), nullable=False)
#     class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
#     date = db.Column(db.Date, nullable=False)
#     start_time = db.Column(db.Time, nullable=False)
#     end_time = db.Column(db.Time, nullable=False)
#     max_capacity = db.Column(db.Integer, nullable=False, default=4)
#     current_bookings = db.Column(db.Integer, nullable=False, default=0)
#     is_active = db.Column(db.Boolean, default=True)
#     is_cancelled = db.Column(db.Boolean, default=False)
#     created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
#     # Relationships
#     class_info = db.relationship('Class', backref='schedule_instances')
#     bookings = db.relationship('ClassBooking', backref='schedule_instance', lazy=True)

# class ClassBooking(db.Model):
#     """Customer booking for a specific schedule instance"""
#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(db.Integer, db.ForeignKey('SrUsers.id'), nullable=False)
#     schedule_instance_id = db.Column(db.Integer, db.ForeignKey('schedule_instance.id'), nullable=False)
#     status = db.Column(db.String(20), default='booked')  # booked, attended, cancelled, no_show
#     booking_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
#     attended_at = db.Column(db.DateTime, nullable=True)
#     cancelled_at = db.Column(db.DateTime, nullable=True)
    
#     # Relationships
#     user = db.relationship('SrUsers', backref='class_bookings')

# =========================================================================================
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
    
    # Add this back - it's needed for the Booking model
    bookings = db.relationship('Booking', backref='booking_user', lazy=True)  # Changed backref name
    class_bookings = db.relationship('ClassBooking', backref='class_booking_user', lazy=True)  # For ClassBooking

class Class(db.Model):
    __tablename__ = 'class'  # Explicitly set table name
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    instructor = db.Column(db.String(100), nullable=False)
    duration = db.Column(db.String(20), nullable=False)
    difficulty = db.Column(db.String(20), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # schedules = db.relationship('ClassSchedule', backref='class_info', lazy=True)
    # Add this back - it's needed for the Booking model
    # bookings = db.relationship('Booking', backref='booking_class', lazy=True)  # Changed backref name
    weekly_schedules = db.relationship('WeeklySchedule', backref='weekly_class', lazy=True)
    # schedule_instances = db.relationship('ScheduleInstance', backref='instance_class', lazy=True)

class ClassSchedule(db.Model):
    __tablename__ = 'class_schedule'
    
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
    day_of_week = db.Column(db.String(10), nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)

class Booking(db.Model):
    __tablename__ = 'booking'
    
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
    
    # Use the backref names we defined in User and Class models
    # No need to define relationships here since we're using backref
    # But if you want to explicitly define them:
    # user = db.relationship('User', backref='bookings')
    # class_info = db.relationship('Class', backref='bookings')

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
            'user_name': self.booking_user.name if self.booking_user else None  # Changed to booking_user
        }
        
        if self.booking_type == 'class':
            data.update({
                'class_id': self.class_id,
                'class_name': self.booking_class.name if self.booking_class else None,  # Changed to booking_class
                'booking_date': self.booking_date.isoformat() if self.booking_date else None,
                'booking_time': self.booking_time.strftime('%H:%M') if self.booking_time else None,
                'instructor': self.booking_class.instructor if self.booking_class else None  # Changed to booking_class
            })
        elif self.booking_type == 'membership':
            data.update({
                'package_type': self.package_type,
                'package_sessions': self.package_sessions,
                'package_validity_days': self.package_validity_days
            })
            
        return data

# ... [PackageConfig, Contact, ChatHistory models remain the same] ...

# In your models section, update the relationships:

class WeeklySchedule(db.Model):
    __tablename__ = 'weekly_schedule'
    
    """Weekly class schedule set by admin"""
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
    day_of_week = db.Column(db.String(10), nullable=False)  # Monday, Tuesday, etc.
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    max_capacity = db.Column(db.Integer, nullable=False, default=4)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # # Relationships - Use unique backref names
    # class_ref = db.relationship('Class', backref='weekly_schedule_refs')
    # class_info = db.relationship('Class', backref='weekly_schedules')
    # schedule_instances = db.relationship('ScheduleInstance', backref='parent_schedule', lazy=True)

class ScheduleInstance(db.Model):
    __tablename__ = 'schedule_instance'
    
    """Specific date instances generated from weekly schedule"""
    id = db.Column(db.Integer, primary_key=True)
    weekly_schedule_id = db.Column(db.Integer, db.ForeignKey('weekly_schedule.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    max_capacity = db.Column(db.Integer, nullable=False, default=4)
    current_bookings = db.Column(db.Integer, nullable=False, default=0)
    is_active = db.Column(db.Boolean, default=True)
    is_cancelled = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships - Use unique backref names
    # class_ref = db.relationship('Class', backref='instance_refs')
    # # parent_schedule is defined by backref from WeeklySchedule
    # bookings = db.relationship('ClassBooking', backref='instance_booking', lazy=True)

    class_info = db.relationship('Class', backref='schedule_instances')
    weekly_schedule = db.relationship('WeeklySchedule', backref='instances')
    bookings = db.relationship('ClassBooking', backref='schedule_instance')

class ClassBooking(db.Model):
    __tablename__ = 'class_booking'
    
    """Customer booking for a specific schedule instance"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('SrUsers.id'), nullable=False)
    schedule_instance_id = db.Column(db.Integer, db.ForeignKey('schedule_instance.id'), nullable=False)
    status = db.Column(db.String(20), default='booked')  # booked, attended, cancelled, no_show
    booking_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    attended_at = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    # user = db.relationship('User', backref='user_class_bookings')
    # instance_booking is defined by backref from ScheduleInstance

# class ClassBooking(db.Model):
#     __tablename__ = 'class_booking'
    
#     """Customer booking for a specific schedule instance"""
#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(db.Integer, db.ForeignKey('SrUsers.id'), nullable=False)
#     schedule_instance_id = db.Column(db.Integer, db.ForeignKey('schedule_instance.id'), nullable=False)
#     status = db.Column(db.String(20), default='booked')  # booked, attended, cancelled, no_show
#     booking_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
#     attended_at = db.Column(db.DateTime, nullable=True)
#     cancelled_at = db.Column(db.DateTime, nullable=True)
    
#     # Use the backref name we defined in User model
#     user = db.relationship('User', backref='class_bookings')
#     # schedule_instance = db.relationship('ScheduleInstance', backref='bookings')


class UserMembership(db.Model):
    __tablename__ = 'user_membership'
    
    """User's active membership packages"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('SrUsers.id'), nullable=False)
    package_type = db.Column(db.String(50), nullable=False)
    total_sessions = db.Column(db.Integer, nullable=False)
    used_sessions = db.Column(db.Integer, nullable=False, default=0)
    remaining_sessions = db.Column(db.Integer, nullable=False)
    purchase_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    valid_until = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationship
    # user = db.relationship('User', backref='memberships')

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
            default_capacity = 4
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


# ==================================================

@app.route('/api/admin/weekly-schedule/<int:schedule_id>/instances', methods=['POST'])
@jwt_required()
def generate_schedule_instances_endpoint(schedule_id):
    """Admin manually generates schedule instances"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        data = request.get_json()
        days_ahead = data.get('days_ahead', 30)
        
        generated = generate_schedule_instances(schedule_id, days_ahead)
        
        return jsonify({
            'message': f'Generated {generated} schedule instances',
            'schedule_id': schedule_id,
            'instances_generated': generated
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error('Generate instances error: %s', str(e))
        return jsonify({'message': str(e)}), 500

def generate_schedule_instances(schedule_id, days_ahead=30):
    """Generate schedule instances from weekly schedule"""
    schedule = WeeklySchedule.query.get(schedule_id)
    if not schedule or not schedule.is_active:
        return 0
    
    day_mapping = {
        'Monday': 0,
        'Tuesday': 1,
        'Wednesday': 2,
        'Thursday': 3,
        'Friday': 4,
        'Saturday': 5,
        'Sunday': 6
    }
    
    target_weekday = day_mapping.get(schedule.day_of_week)
    if target_weekday is None:
        return 0
    
    today = datetime.now().date()
    end_date = today + timedelta(days=days_ahead)
    
    generated = 0
    
    # Generate instances for each occurrence of the day within the date range
    current_date = today
    while current_date <= end_date:
        if current_date.weekday() == target_weekday:
            # Check if instance already exists
            existing_instance = ScheduleInstance.query.filter_by(
                weekly_schedule_id=schedule_id,
                date=current_date
            ).first()
            
            if not existing_instance:
                # Create new instance
                instance = ScheduleInstance(
                    weekly_schedule_id=schedule_id,
                    class_id=schedule.class_id,
                    date=current_date,
                    start_time=schedule.start_time,
                    end_time=schedule.end_time,
                    max_capacity=schedule.max_capacity
                )
                db.session.add(instance)
                generated += 1
        
        current_date += timedelta(days=1)
    
    if generated > 0:
        db.session.commit()
    
    return generated

@app.route('/api/admin/weekly-schedule', methods=['GET'])
@jwt_required()
def get_weekly_schedules():
    """Get all weekly schedules for admin"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get all weekly schedules with class info
        schedules = WeeklySchedule.query.all()
        
        result = []
        for schedule in schedules:
            # Get class info
            class_item = Class.query.get(schedule.class_id)
            class_name = class_item.name if class_item else "Unknown Class"
            
            # Count upcoming instances for this schedule
            upcoming_count = ScheduleInstance.query.filter(
                ScheduleInstance.weekly_schedule_id == schedule.id,
                ScheduleInstance.date >= datetime.now().date(),
                ScheduleInstance.is_cancelled == False
            ).count()
            
            result.append({
                'id': schedule.id,
                'class_id': schedule.class_id,
                'class_name': class_name,
                'day_of_week': schedule.day_of_week,
                'start_time': schedule.start_time.strftime('%H:%M') if schedule.start_time else None,
                'end_time': schedule.end_time.strftime('%H:%M') if schedule.end_time else None,
                'max_capacity': schedule.max_capacity,
                'is_active': schedule.is_active,
                'created_at': schedule.created_at.isoformat() if schedule.created_at else None,
                'upcoming_instances': upcoming_count
            })
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Get weekly schedules error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/schedule-instances', methods=['GET'])
@jwt_required()
def get_schedule_instances():
    """Get all schedule instances with filters"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get filter parameters
        class_id = request.args.get('class_id')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        status = request.args.get('status', 'upcoming')  # upcoming, past, cancelled
        
        # Build query
        query = ScheduleInstance.query
        
        # Apply filters
        if class_id:
            query = query.filter(ScheduleInstance.class_id == class_id)
        
        if date_from:
            query = query.filter(ScheduleInstance.date >= date_from)
        
        if date_to:
            query = query.filter(ScheduleInstance.date <= date_to)
        
        today = datetime.now().date()
        if status == 'upcoming':
            query = query.filter(
                ScheduleInstance.date >= today, 
                ScheduleInstance.is_cancelled == False
            )
        elif status == 'past':
            query = query.filter(ScheduleInstance.date < today)
        elif status == 'cancelled':
            query = query.filter(ScheduleInstance.is_cancelled == True)
        
        # Order by date and time
        instances = query.order_by(ScheduleInstance.date, ScheduleInstance.start_time).all()
        
        result = []
        for instance in instances:
            # Get class info
            class_item = Class.query.get(instance.class_id)
            class_name = class_item.name if class_item else "Unknown Class"
            
            # Get weekly schedule info
            weekly_schedule = WeeklySchedule.query.get(instance.weekly_schedule_id)
            day_of_week = weekly_schedule.day_of_week if weekly_schedule else None
            
            # Get booked users for this instance
            bookings = ClassBooking.query.filter_by(schedule_instance_id=instance.id).all()
            booked_users = []
            for booking in bookings:
                user_obj = User.query.get(booking.user_id)
                if user_obj:
                    booked_users.append({
                        'id': user_obj.id,
                        'name': user_obj.name,
                        'email': user_obj.email
                    })
            
            result.append({
                'id': instance.id,
                'class_id': instance.class_id,
                'class_name': class_name,
                'schedule_id': instance.weekly_schedule_id,
                'day_of_week': day_of_week,
                'date': instance.date.isoformat() if instance.date else None,
                'start_time': instance.start_time.strftime('%H:%M') if instance.start_time else None,
                'end_time': instance.end_time.strftime('%H:%M') if instance.end_time else None,
                'max_capacity': instance.max_capacity,
                'current_bookings': instance.current_bookings,
                'available_spots': instance.max_capacity - instance.current_bookings,
                'is_cancelled': instance.is_cancelled,
                'instructor': class_item.instructor if class_item else None,
                'booked_users': booked_users,
                'created_at': instance.created_at.isoformat() if instance.created_at else None
            })
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Get schedule instances error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/schedule-instances/<int:instance_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_schedule_instance(instance_id):
    """Admin cancels a specific schedule instance"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        instance = ScheduleInstance.query.get(instance_id)
        if not instance:
            return jsonify({'message': 'Schedule instance not found'}), 404
        
        # Check if instance is in the future
        instance_datetime = datetime.combine(instance.date, instance.start_time)
        if instance_datetime < datetime.now():
            return jsonify({'message': 'Cannot cancel past schedule instances'}), 400
        
        # Mark instance as cancelled
        instance.is_cancelled = True
        
        # Get all bookings for this instance
        bookings = ClassBooking.query.filter_by(
            schedule_instance_id=instance_id,
            status='booked'
        ).all()
        
        # Refund sessions to users and notify them
        for booking in bookings:
            booking.status = 'cancelled_by_admin'
            booking.cancelled_at = datetime.now(timezone.utc)
            
            # Refund session to user's membership
            active_membership = UserMembership.query.filter_by(
                user_id=booking.user_id,
                is_active=True
            ).first()
            
            if active_membership:
                active_membership.used_sessions -= 1
                active_membership.remaining_sessions += 1
                # Reactivate if needed
                if not active_membership.is_active and active_membership.remaining_sessions > 0:
                    active_membership.is_active = True
            
            # Notify user via SMS
            user = User.query.get(booking.user_id)
            if user and user.phone:
                message = f"""❌ Class Cancelled by Admin
    
Class: {instance.class_info.name}
Date: {instance.date.strftime('%Y-%m-%d')}
Time: {instance.start_time.strftime('%I:%M %p')}
    
This class has been cancelled by admin. Your session has been refunded to your account.
You now have {active_membership.remaining_sessions if active_membership else 0} sessions remaining.
    
We apologize for any inconvenience."""
                send_sms(user.phone, message)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Schedule instance cancelled. {len(bookings)} users notified and refunded.',
            'cancelled_bookings': len(bookings)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error('Cancel schedule instance error: %s', str(e))
        return jsonify({'message': str(e)}), 500

# =========================================================
@app.route('/api/admin/weekly-schedule/<int:schedule_id>/toggle', methods=['PUT'])
@jwt_required()
def toggle_weekly_schedule(schedule_id):
    """Toggle schedule active status"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        schedule = WeeklySchedule.query.get(schedule_id)
        if not schedule:
            return jsonify({'message': 'Schedule not found'}), 404
        
        schedule.is_active = not schedule.is_active
        db.session.commit()
        
        return jsonify({
            'message': f'Schedule {"activated" if schedule.is_active else "deactivated"} successfully',
            'is_active': schedule.is_active
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error('Toggle schedule error: %s', str(e))
        return jsonify({'message': str(e)}), 500

@app.route('/api/admin/weekly-schedule/<int:schedule_id>', methods=['DELETE'])
@jwt_required()
def delete_weekly_schedule(schedule_id):
    """Delete a weekly schedule"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        schedule = WeeklySchedule.query.get(schedule_id)
        if not schedule:
            return jsonify({'message': 'Schedule not found'}), 404
        
        # Check if there are any future instances
        future_instances = ScheduleInstance.query.filter(
            ScheduleInstance.weekly_schedule_id == schedule_id,
            ScheduleInstance.date >= datetime.now().date()
        ).count()
        
        if future_instances > 0:
            return jsonify({
                'message': f'Cannot delete schedule with {future_instances} future instances. Cancel them first.',
                'future_instances': future_instances
            }), 400
        
        db.session.delete(schedule)
        db.session.commit()
        
        return jsonify({
            'message': 'Schedule deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error('Delete schedule error: %s', str(e))
        return jsonify({'message': str(e)}), 500

@app.route('/api/admin/schedule-instances/<int:instance_id>/update-capacity', methods=['PUT'])
@jwt_required()
def update_schedule_instance_capacity(instance_id):
    """Update capacity for a specific schedule instance"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        data = request.get_json()
        new_capacity = data.get('max_capacity')
        
        if not new_capacity or new_capacity < 1:
            return jsonify({'message': 'Invalid capacity value'}), 400
        
        instance = ScheduleInstance.query.get(instance_id)
        if not instance:
            return jsonify({'message': 'Schedule instance not found'}), 404
        
        # Check if new capacity is less than current bookings
        if new_capacity < instance.current_bookings:
            return jsonify({
                'message': f'Cannot reduce capacity below current bookings ({instance.current_bookings})'
            }), 400
        
        instance.max_capacity = new_capacity
        db.session.commit()
        
        return jsonify({
            'message': 'Capacity updated successfully',
            'max_capacity': instance.max_capacity,
            'available_spots': instance.max_capacity - instance.current_bookings
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error('Update capacity error: %s', str(e))
        return jsonify({'message': str(e)}), 500

@app.route('/api/admin/schedule-instances/<int:instance_id>/status', methods=['PUT'])
@jwt_required()
def update_instance_status(instance_id):
    """Update status of a schedule instance (active/cancelled)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        data = request.get_json()
        new_status = data.get('is_active')
        
        instance = ScheduleInstance.query.get(instance_id)
        if not instance:
            return jsonify({'message': 'Schedule instance not found'}), 404
        
        if new_status is not None:
            instance.is_active = bool(new_status)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Instance {"activated" if instance.is_active else "deactivated"}',
            'is_active': instance.is_active,
            'is_cancelled': instance.is_cancelled
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error('Update instance status error: %s', str(e))
        return jsonify({'message': str(e)}), 500

@app.route('/api/admin/class-attendance/<int:instance_id>', methods=['POST'])
@jwt_required()
def mark_class_attendance(instance_id):
    """Mark attendance for a class instance"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        data = request.get_json()
        booking_ids = data.get('booking_ids', [])
        attendance_status = data.get('status', 'attended')  # attended, no_show
        
        # Get the schedule instance
        instance = ScheduleInstance.query.get(instance_id)
        if not instance:
            return jsonify({'message': 'Class instance not found'}), 404
        
        # Get all bookings for this instance
        bookings = ClassBooking.query.filter(
            ClassBooking.schedule_instance_id == instance_id,
            ClassBooking.status == 'booked'
        ).all()
        
        updated_count = 0
        for booking in bookings:
            if booking.id in booking_ids and attendance_status == 'attended':
                booking.status = 'attended'
                booking.attended_at = datetime.now(timezone.utc)
                updated_count += 1
            elif booking.status == 'booked':
                booking.status = 'no_show'
        
        db.session.commit()
        
        return jsonify({
            'message': f'Attendance marked for {updated_count} users',
            'total_bookings': len(bookings),
            'attended': updated_count,
            'no_show': len(bookings) - updated_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error('Mark attendance error: %s', str(e))
        return jsonify({'message': str(e)}), 500

@app.route('/api/admin/class-attendance/<int:instance_id>', methods=['GET'])
@jwt_required()
def get_class_attendance(instance_id):
    """Get attendance list for a class instance"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        
        # Get the schedule instance
        instance = ScheduleInstance.query.get(instance_id)
        if not instance:
            return jsonify({'message': 'Class instance not found'}), 404
        
        # Get all bookings for this instance
        bookings = db.session.query(ClassBooking, User).join(
            User, ClassBooking.user_id == User.id
        ).filter(
            ClassBooking.schedule_instance_id == instance_id
        ).all()
        
        attendance_list = []
        for booking, user_obj in bookings:
            attendance_list.append({
                'booking_id': booking.id,
                'user_id': user_obj.id,
                'user_name': user_obj.name,
                'user_email': user_obj.email,
                'user_phone': user_obj.phone,
                'status': booking.status,
                'booking_date': booking.booking_date.isoformat(),
                'attended_at': booking.attended_at.isoformat() if booking.attended_at else None,
                'cancelled_at': booking.cancelled_at.isoformat() if booking.cancelled_at else None
            })
        
        # Get class info
        class_info = Class.query.get(instance.class_id)
        
        return jsonify({
            'instance_id': instance_id,
            'class_name': class_info.name if class_info else 'Unknown Class',
            'date': instance.date.isoformat(),
            'start_time': instance.start_time.strftime('%H:%M'),
            'end_time': instance.end_time.strftime('%H:%M'),
            'instructor': class_info.instructor if class_info else '',
            'total_capacity': instance.max_capacity,
            'current_bookings': instance.current_bookings,
            'attendance': attendance_list
        }), 200
        
    except Exception as e:
        logger.error('Get attendance error: %s', str(e))
        return jsonify({'message': str(e)}), 500

# =========================================================
        
# ============================================

@app.route('/api/bookings', methods=['GET'])
@jwt_required()
def get_user_bookings():
    try:
        current_user_id = get_jwt_identity()
        
        # Use explicit join to get class information
        bookings = db.session.query(Booking, Class).outerjoin(
            Class, Booking.class_id == Class.id
        ).filter(
            Booking.user_id == current_user_id
        ).order_by(Booking.created_at.desc()).all()
        
        bookings_data = []
        for booking, class_info in bookings:
            data = {
                'id': booking.id,
                'user_id': booking.user_id,
                'booking_type': booking.booking_type,
                'reference_number': booking.reference_number,
                'amount': booking.amount,
                'status': booking.status,
                'payment_method': booking.payment_method,
                'payment_status': booking.payment_status,
                'created_at': booking.created_at.isoformat(),
                'user_name': booking.booking_user.name if booking.booking_user else None
            }
            
            if booking.booking_type == 'class':
                data.update({
                    'class_id': booking.class_id,
                    'class_name': class_info.name if class_info else None,
                    'booking_date': booking.booking_date.isoformat() if booking.booking_date else None,
                    'booking_time': booking.booking_time.strftime('%H:%M') if booking.booking_time else None,
                    'instructor': class_info.instructor if class_info else None
                })
            elif booking.booking_type == 'membership':
                data.update({
                    'package_type': booking.package_type,
                    'package_sessions': booking.package_sessions,
                    'package_validity_days': booking.package_validity_days
                })
                
            bookings_data.append(data)
        
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
        
#         # Get customer details
#         customer = User.query.get(booking.user_id)
#         if not customer:
#             return jsonify({'message': 'Customer not found'}), 404
        
#         # Approve the booking
#         booking.status = 'active'
#         booking.payment_status = 'verified'
#         booking.confirmed_at = datetime.now(timezone.utc)
        
#         # Update user membership plan if needed
#         if customer:
#             # Extract package name for display
#             package_name = booking.package_type.replace('-', ' ').title()
#             customer.membership_plan = package_name
        
#         db.session.commit()
        
#         # Send approval SMS to customer
#         try:
#             if customer.phone:
#                 send_approval_notification_sms(customer, booking)
#         except Exception as sms_error:
#             logger.error(f"Approval SMS sending failed: {sms_error}")
#             # Don't fail the approval if SMS fails
        
#         return jsonify({
#             'message': 'Membership booking approved successfully',
#             'booking': {
#                 'id': booking.id,
#                 'status': booking.status,
#                 'reference_number': booking.reference_number,
#                 'user_name': customer.name if customer else 'Unknown'
#             }
#         }), 200
        
#     except Exception as e:
#         db.session.rollback()
#         logger.error('Approve membership error: %s', str(e))
#         return jsonify({'message': str(e)}), 500


# ===================================================================
@app.route('/api/admin/bookings/<int:booking_id>/approve', methods=['POST'])
@jwt_required()
def approve_membership_booking(booking_id):
    """Admin approves a membership booking - UPDATED TO CREATE UserMembership"""
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
        
        # Update user membership plan
        package_name = booking.package_type.replace('-', ' ').title()
        customer.membership_plan = package_name
        
        # Create UserMembership entry
        valid_until = datetime.now(timezone.utc) + timedelta(
            days=booking.package_validity_days or 30
        )
        
        # Check if user already has an active membership
        existing_membership = UserMembership.query.filter_by(
            user_id=booking.user_id,
            is_active=True
        ).first()
        
        if existing_membership:
            # Update existing membership
            existing_membership.total_sessions += (booking.package_sessions or 0)
            existing_membership.remaining_sessions += (booking.package_sessions or 0)
            existing_membership.valid_until = max(existing_membership.valid_until, valid_until)
        else:
            # Create new membership
            new_membership = UserMembership(
                user_id=booking.user_id,
                package_type=booking.package_type,
                total_sessions=booking.package_sessions or 0,
                used_sessions=0,
                remaining_sessions=booking.package_sessions or 0,
                valid_until=valid_until,
                is_active=True
            )
            db.session.add(new_membership)
        
        db.session.commit()
        
        # Send approval SMS to customer
        try:
            if customer.phone:
                send_approval_notification_sms(customer, booking)
        except Exception as sms_error:
            logger.error(f"Approval SMS sending failed: {sms_error}")
        
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
#=====================================================================

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


# ============================================================================
@app.route('/api/admin/weekly-schedule', methods=['POST'])
@jwt_required()
def create_weekly_schedule():
    """Create a new weekly schedule"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['class_id', 'day_of_week', 'start_time', 'end_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Parse and validate class_id
        try:
            class_id = int(data['class_id'])
        except ValueError:
            return jsonify({'error': 'Invalid class ID'}), 400
        
        # Verify class exists
        class_item = Class.query.get(class_id)
        if not class_item:
            return jsonify({'error': 'Class not found'}), 404
        
        # Parse times
        try:
            start_time = datetime.strptime(data['start_time'], '%H:%M').time()
            end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        except ValueError:
            return jsonify({'error': 'Invalid time format. Use HH:MM (24-hour format)'}), 400
        
        # Validate max_capacity
        max_capacity = data.get('max_capacity', 4)
        if max_capacity < 1 or max_capacity > 20:
            return jsonify({'error': 'Max capacity must be between 1 and 20'}), 400
        
        # Validate day_of_week
        valid_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        if data['day_of_week'] not in valid_days:
            return jsonify({'error': 'Invalid day of week'}), 400
        
        # Check if schedule already exists for this class/day/time
        existing_schedule = WeeklySchedule.query.filter_by(
            class_id=class_id,
            day_of_week=data['day_of_week'],
            start_time=start_time
        ).first()
        
        if existing_schedule:
            return jsonify({'error': 'Schedule already exists for this class, day, and time'}), 400
        
        # Create weekly schedule
        schedule = WeeklySchedule(
            class_id=class_id,
            day_of_week=data['day_of_week'],
            start_time=start_time,
            end_time=end_time,
            max_capacity=max_capacity
        )
        
        db.session.add(schedule)
        db.session.commit()
        
        return jsonify({
            'message': 'Weekly schedule created successfully',
            'schedule': {
                'id': schedule.id,
                'class_id': schedule.class_id,
                'class_name': class_item.name,
                'day_of_week': schedule.day_of_week,
                'start_time': schedule.start_time.strftime('%H:%M'),
                'end_time': schedule.end_time.strftime('%H:%M'),
                'max_capacity': schedule.max_capacity,
                'is_active': schedule.is_active,
                'created_at': schedule.created_at.isoformat() if schedule.created_at else None
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Create weekly schedule error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/available-classes', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_available_classes():
    """Get available class instances for users"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        current_user_id = get_jwt_identity()
        print(f"DEBUG: User {current_user_id} fetching available classes")
        
        # Get query parameters
        class_id = request.args.get('class_id')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Default: show classes from today to 30 days ahead
        today = datetime.now().date()
        if not date_from:
            date_from = today
        elif date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
            except:
                date_from = today
        
        if not date_to:
            date_to = date_from + timedelta(days=30)
        elif date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
            except:
                date_to = date_from + timedelta(days=30)
        
        print(f"DEBUG: Date range: {date_from} to {date_to}")
        
        # Build query with proper joins
        query = db.session.query(ScheduleInstance, Class).join(
            Class, ScheduleInstance.class_id == Class.id
        ).filter(
            ScheduleInstance.is_active == True,
            ScheduleInstance.is_cancelled == False,
            ScheduleInstance.date >= date_from,
            ScheduleInstance.date <= date_to,
            ScheduleInstance.current_bookings < ScheduleInstance.max_capacity
        )
        
        if class_id:
            try:
                query = query.filter(ScheduleInstance.class_id == int(class_id))
            except:
                pass
        
        # Filter out past classes
        current_time = datetime.now().time()
        instances_with_classes = query.order_by(ScheduleInstance.date, ScheduleInstance.start_time).all()
        
        print(f"DEBUG: Found {len(instances_with_classes)} instances with classes")
        
        available_classes = []
        for instance, class_info in instances_with_classes:
            # Skip past instances
            if instance.date < today or (instance.date == today and instance.start_time < current_time):
                continue
            
            # Check if user has already booked this class
            existing_booking = ClassBooking.query.filter_by(
                user_id=current_user_id,
                schedule_instance_id=instance.id,
                status='booked'
            ).first()
            
            if existing_booking:
                continue
            
            available_classes.append({
                'id': instance.id,
                'class_id': instance.class_id,
                'class_name': class_info.name,
                'instructor': class_info.instructor,
                'duration': class_info.duration,
                'difficulty': class_info.difficulty,
                'description': class_info.description,
                'date': instance.date.isoformat(),
                'day_of_week': instance.date.strftime('%A'),
                'start_time': instance.start_time.strftime('%H:%M'),
                'end_time': instance.end_time.strftime('%H:%M') if instance.end_time else None,
                'max_capacity': instance.max_capacity,
                'current_bookings': instance.current_bookings,
                'available_spots': instance.max_capacity - instance.current_bookings,
                'is_booked_by_user': False
            })
        
        print(f"DEBUG: Returning {len(available_classes)} available classes")
        return jsonify(available_classes), 200
        
    except Exception as e:
        print(f"ERROR in get_available_classes: {str(e)}")
        import traceback
        traceback.print_exc()
        logger.error('Get available classes error: %s', str(e))
        return jsonify({'message': str(e), 'error': str(e)}), 500

@app.route('/api/book-class', methods=['POST'])
@jwt_required()
def book_class():
    """User books a class instance - FIXED DATETIME COMPARISON"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        if 'schedule_instance_id' not in data:
            return jsonify({'message': 'Missing schedule_instance_id'}), 400
        
        instance_id = data['schedule_instance_id']
        
        # Check if instance exists and is available
        instance = ScheduleInstance.query.get(instance_id)
        if not instance:
            return jsonify({'message': 'Class instance not found'}), 404
        
        if not instance.is_active or instance.is_cancelled:
            return jsonify({'message': 'This class is not available'}), 400
        
        if instance.current_bookings >= instance.max_capacity:
            return jsonify({'message': 'This class is fully booked'}), 400
        
        # FIXED: Check if class is in the future - SIMPLIFIED
        class_datetime = datetime.combine(instance.date, instance.start_time)
        now = datetime.now()  # Both naive
        
        # Add buffer - can't book classes that have already started
        if class_datetime <= now:
            return jsonify({'message': 'Cannot book classes that have already started or are in the past'}), 400
        
        # Check if user has already booked this class
        existing_booking = ClassBooking.query.filter_by(
            user_id=current_user_id,
            schedule_instance_id=instance_id
        ).first()
        
        if existing_booking:
            return jsonify({'message': 'You have already booked this class'}), 400
        
        # Check if user has active membership with remaining sessions
        active_membership = UserMembership.query.filter(
            UserMembership.user_id == current_user_id,
            UserMembership.is_active == True,
            UserMembership.remaining_sessions > 0
        ).first()
        
        if not active_membership:
            # Check for approved membership booking
            approved_booking = Booking.query.filter(
                Booking.user_id == current_user_id,
                Booking.booking_type == 'membership',
                Booking.status == 'active',
                Booking.payment_status.in_(['verified', 'paid'])
            ).first()
            
            if approved_booking:
                # Create UserMembership on the fly
                valid_until = datetime.now(timezone.utc) + timedelta(
                    days=approved_booking.package_validity_days or 30
                )
                
                active_membership = UserMembership(
                    user_id=current_user_id,
                    package_type=approved_booking.package_type,
                    total_sessions=approved_booking.package_sessions or 0,
                    used_sessions=0,
                    remaining_sessions=approved_booking.package_sessions or 0,
                    valid_until=valid_until,
                    is_active=True,
                    purchase_date=datetime.now(timezone.utc)
                )
                
                db.session.add(active_membership)
                db.session.commit()
            else:
                return jsonify({
                    'message': 'You need an active membership with remaining sessions to book classes',
                    'requires_membership': True
                }), 400
        
        # FIXED: Check if membership is still valid
        # Convert valid_until to naive datetime if it's aware
        if active_membership.valid_until:
            # If valid_until is aware, make it naive for comparison
            valid_until_naive = active_membership.valid_until.replace(tzinfo=None) if active_membership.valid_until.tzinfo else active_membership.valid_until
            
            if valid_until_naive < now:
                active_membership.is_active = False
                db.session.commit()
                return jsonify({
                    'message': 'Your membership has expired',
                    'requires_membership': True
                }), 400
        
        # Create the class booking
        class_booking = ClassBooking(
            user_id=current_user_id,
            schedule_instance_id=instance_id,
            status='booked'
        )
        
        # Update instance bookings count
        instance.current_bookings += 1
        
        # Decrement user's remaining sessions
        active_membership.used_sessions += 1
        active_membership.remaining_sessions -= 1
        
        # If no sessions left, mark membership as inactive
        if active_membership.remaining_sessions <= 0:
            active_membership.is_active = False
        
        db.session.add(class_booking)
        db.session.commit()
        
        # Send confirmation SMS
        try:
            if user.phone:
                message = f"""✅ Class Booked Successfully!
    
Class: {instance.class_info.name}
Date: {instance.date.strftime('%Y-%m-%d')} ({instance.date.strftime('%A')})
Time: {instance.start_time.strftime('%I:%M %p')} - {instance.end_time.strftime('%I:%M %p')}
Instructor: {instance.class_info.instructor}
    
Remaining Sessions: {active_membership.remaining_sessions}
    
Please arrive 10 minutes early.
See you at the studio!"""
                send_sms(user.phone, message)
        except Exception as sms_error:
            logger.error(f"Booking confirmation SMS failed: {sms_error}")
        
        return jsonify({
            'message': 'Class booked successfully!',
            'booking': {
                'id': class_booking.id,
                'class_name': instance.class_info.name,
                'date': instance.date.isoformat(),
                'start_time': instance.start_time.strftime('%H:%M'),
                'end_time': instance.end_time.strftime('%H:%M'),
                'remaining_sessions': active_membership.remaining_sessions
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error('Book class error: %s', str(e))
        import traceback
        traceback.print_exc()
        return jsonify({
            'message': f'Failed to book class: {str(e)}',
            'error': str(e)
        }), 500

@app.route('/api/my-booked-classes', methods=['GET'])
@jwt_required()
def get_my_booked_classes():
    """Get user's booked classes"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get upcoming booked classes
        upcoming_bookings = db.session.query(ClassBooking, ScheduleInstance, Class).join(
            ScheduleInstance, ClassBooking.schedule_instance_id == ScheduleInstance.id
        ).join(
            Class, ScheduleInstance.class_id == Class.id
        ).filter(
            ClassBooking.user_id == current_user_id,
            ClassBooking.status == 'booked',
            ScheduleInstance.date >= datetime.now().date()
        ).order_by(ScheduleInstance.date, ScheduleInstance.start_time).all()
        
        # Get past classes
        past_bookings = db.session.query(ClassBooking, ScheduleInstance, Class).join(
            ScheduleInstance, ClassBooking.schedule_instance_id == ScheduleInstance.id
        ).join(
            Class, ScheduleInstance.class_id == Class.id
        ).filter(
            ClassBooking.user_id == current_user_id,
            ClassBooking.status != 'booked'
        ).order_by(ScheduleInstance.date.desc(), ScheduleInstance.start_time.desc()).limit(20).all()
        
        def format_booking_data(bookings):
            data = []
            for booking, instance, class_info in bookings:
                data.append({
                    'booking_id': booking.id,
                    'schedule_instance_id': instance.id,
                    'class_id': class_info.id,
                    'class_name': class_info.name,
                    'instructor': class_info.instructor,
                    'date': instance.date.isoformat(),
                    'day_of_week': instance.date.strftime('%A'),
                    'start_time': instance.start_time.strftime('%H:%M'),
                    'end_time': instance.end_time.strftime('%H:%M'),
                    'status': booking.status,
                    'booking_date': booking.booking_date.isoformat(),
                    'attended_at': booking.attended_at.isoformat() if booking.attended_at else None,
                    'cancelled_at': booking.cancelled_at.isoformat() if booking.cancelled_at else None,
                    'can_cancel': booking.status == 'booked' and 
                                 datetime.combine(instance.date, instance.start_time) > datetime.now() + timedelta(hours=2)
                })
            return data
        
        # Check active membership
        active_membership = UserMembership.query.filter_by(
            user_id=current_user_id,
            is_active=True
        ).first()
        
        membership_info = None
        if active_membership:
            membership_info = {
                'package_type': active_membership.package_type,
                'total_sessions': active_membership.total_sessions,
                'used_sessions': active_membership.used_sessions,
                'remaining_sessions': active_membership.remaining_sessions,
                'valid_until': active_membership.valid_until.isoformat(),
                'is_active': active_membership.is_active
            }
        
        return jsonify({
            'upcoming_classes': format_booking_data(upcoming_bookings),
            'past_classes': format_booking_data(past_bookings),
            'membership': membership_info
        }), 200
        
    except Exception as e:
        logger.error('Get booked classes error: %s', str(e))
        return jsonify({'message': str(e)}), 500

@app.route('/api/cancel-booking/<int:booking_id>', methods=['POST'])
@jwt_required()
def cancel_booking(booking_id):
    """User cancels a booked class"""
    try:
        current_user_id = get_jwt_identity()
        
        # Find the booking
        booking = ClassBooking.query.get(booking_id)
        if not booking:
            return jsonify({'message': 'Booking not found'}), 404
        
        # Verify ownership
        if booking.user_id != int(current_user_id):
            return jsonify({'message': 'Unauthorized'}), 403
        
        # Check if booking is still active
        if booking.status != 'booked':
            return jsonify({'message': 'This booking cannot be cancelled'}), 400
        
        # Get the schedule instance
        instance = ScheduleInstance.query.get(booking.schedule_instance_id)
        if not instance:
            return jsonify({'message': 'Class instance not found'}), 404
        
        # Check if class is in the future and can be cancelled (at least 2 hours before)
        class_datetime = datetime.combine(instance.date, instance.start_time)
        time_until_class = class_datetime - datetime.now()
        
        if time_until_class.total_seconds() < 7200:  # 2 hours in seconds
            return jsonify({'message': 'Cancellation must be at least 2 hours before class time'}), 400
        
        # Update booking status
        booking.status = 'cancelled'
        booking.cancelled_at = datetime.now(timezone.utc)
        
        # Decrement instance bookings
        instance.current_bookings -= 1
        
        # Refund session to user's membership
        active_membership = UserMembership.query.filter_by(
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if active_membership:
            active_membership.used_sessions -= 1
            active_membership.remaining_sessions += 1
            # Reactivate membership if it was deactivated due to no sessions
            if not active_membership.is_active and active_membership.remaining_sessions > 0:
                active_membership.is_active = True
        
        db.session.commit()
        
        return jsonify({
            'message': 'Booking cancelled successfully',
            'remaining_sessions': active_membership.remaining_sessions if active_membership else 0
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error('Cancel booking error: %s', str(e))
        return jsonify({'message': str(e)}), 500

@app.route('/api/my-membership', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_my_membership():
    """Get current user's membership info - UPDATED TO CHECK BOOKINGS TOO"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        current_user_id = get_jwt_identity()
        
        # FIRST: Check for active membership in UserMembership table
        active_membership = UserMembership.query.filter_by(
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if active_membership:
            return jsonify({
                'membership': {
                    'id': active_membership.id,
                    'package_type': active_membership.package_type,
                    'total_sessions': active_membership.total_sessions,
                    'used_sessions': active_membership.used_sessions,
                    'remaining_sessions': active_membership.remaining_sessions,
                    'valid_until': active_membership.valid_until.isoformat() if active_membership.valid_until else None,
                    'is_active': active_membership.is_active,
                    'created_at': active_membership.created_at.isoformat() if active_membership.created_at else None
                }
            }), 200
        
        # SECOND: Check for approved membership bookings
        approved_membership_booking = Booking.query.filter(
            Booking.user_id == current_user_id,
            Booking.booking_type == 'membership',
            Booking.status == 'active',  # Check for 'active' status
            Booking.payment_status.in_(['verified', 'paid'])
        ).order_by(Booking.created_at.desc()).first()
        
        if approved_membership_booking:
            # Calculate remaining sessions (assuming 0 used initially)
            total_sessions = approved_membership_booking.package_sessions or 0
            used_sessions = 0  # You should track this somewhere
            remaining_sessions = total_sessions - used_sessions
            
            # Calculate validity date
            valid_until = approved_membership_booking.created_at + timedelta(
                days=approved_membership_booking.package_validity_days or 30
            )
            
            return jsonify({
                'membership': {
                    'id': approved_membership_booking.id,
                    'package_type': approved_membership_booking.package_type,
                    'total_sessions': total_sessions,
                    'used_sessions': used_sessions,
                    'remaining_sessions': remaining_sessions,
                    'valid_until': valid_until.isoformat(),
                    'is_active': True,
                    'created_at': approved_membership_booking.created_at.isoformat() if approved_membership_booking.created_at else None,
                    'source': 'booking'
                }
            }), 200
        
        # THIRD: Check for any pending/successful membership booking
        any_membership_booking = Booking.query.filter(
            Booking.user_id == current_user_id,
            Booking.booking_type == 'membership',
            Booking.status.in_(['pending_admin_approval', 'pending', 'active', 'confirmed'])
        ).order_by(Booking.created_at.desc()).first()
        
        if any_membership_booking:
            status = any_membership_booking.status
            is_active = status in ['active', 'confirmed']
            
            return jsonify({
                'membership': {
                    'id': any_membership_booking.id,
                    'package_type': any_membership_booking.package_type,
                    'total_sessions': any_membership_booking.package_sessions or 0,
                    'used_sessions': 0,
                    'remaining_sessions': any_membership_booking.package_sessions or 0,
                    'valid_until': None,  # Will be set when approved
                    'is_active': is_active,
                    'status': status,
                    'payment_status': any_membership_booking.payment_status,
                    'created_at': any_membership_booking.created_at.isoformat() if any_membership_booking.created_at else None,
                    'source': 'booking_pending'
                }
            }), 200
        
        # No membership found
        return jsonify({
            'membership': None,
            'message': 'No active membership found'
        }), 200
        
    except Exception as e:
        logger.error('Get membership error: %s', str(e))
        return jsonify({'message': str(e)}), 500


# ===================================================================
# WEEKLY SCHEDULE ENDPOINTS FOR USERS
# ===================================================================

@app.route('/api/weekly-schedule', methods=['GET'])
@jwt_required()
def get_weekly_schedule_for_users():
    """Get weekly schedule for users to view and book"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get all active weekly schedules
        schedules = WeeklySchedule.query.filter_by(is_active=True).all()
        
        result = []
        for schedule in schedules:
            # Get class info
            class_item = Class.query.get(schedule.class_id)
            if not class_item:
                continue
                
            # Count available spots for this schedule pattern
            # Get upcoming instances
            upcoming_instances = ScheduleInstance.query.filter(
                ScheduleInstance.weekly_schedule_id == schedule.id,
                ScheduleInstance.date >= datetime.now().date(),
                ScheduleInstance.is_active == True,
                ScheduleInstance.is_cancelled == False
            ).all()
            
            # Calculate total available spots
            total_spots = 0
            for instance in upcoming_instances:
                available_spots = instance.max_capacity - instance.current_bookings
                if available_spots > 0:
                    total_spots += available_spots
            
            # Check if user already booked this recurring pattern
            user_bookings = ClassBooking.query.join(
                ScheduleInstance, ClassBooking.schedule_instance_id == ScheduleInstance.id
            ).filter(
                ClassBooking.user_id == current_user_id,
                ScheduleInstance.weekly_schedule_id == schedule.id,
                ClassBooking.status == 'booked'
            ).all()
            
            is_booked = len(user_bookings) > 0
            
            result.append({
                'id': schedule.id,
                'class_id': schedule.class_id,
                'class_name': class_item.name,
                'day_of_week': schedule.day_of_week,
                'start_time': schedule.start_time.strftime('%H:%M'),
                'end_time': schedule.end_time.strftime('%H:%M'),
                'instructor': class_item.instructor,
                'location': class_item.location if hasattr(class_item, 'location') else 'Studio Reform',
                'difficulty': class_item.difficulty,
                'duration': class_item.duration,
                'description': class_item.description,
                'max_capacity': schedule.max_capacity,
                'available_spots': total_spots,
                'total_upcoming_instances': len(upcoming_instances),
                'is_booked': is_booked,
                'next_occurrences': [instance.date.isoformat() for instance in upcoming_instances[:3]] if upcoming_instances else []
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f'Get weekly schedule error: {str(e)}')
        return jsonify({'message': str(e)}), 500

@app.route('/api/my-weekly-bookings', methods=['GET'])
@jwt_required()
def get_my_weekly_bookings():
    """Get user's recurring weekly bookings"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get all schedule instances booked by user
        user_bookings = db.session.query(
            ClassBooking, ScheduleInstance, WeeklySchedule, Class
        ).join(
            ScheduleInstance, ClassBooking.schedule_instance_id == ScheduleInstance.id
        ).join(
            WeeklySchedule, ScheduleInstance.weekly_schedule_id == WeeklySchedule.id
        ).join(
            Class, WeeklySchedule.class_id == Class.id
        ).filter(
            ClassBooking.user_id == current_user_id,
            ClassBooking.status == 'booked',
            ScheduleInstance.date >= datetime.now().date()
        ).order_by(ScheduleInstance.date, ScheduleInstance.start_time).all()
        
        # Group by weekly schedule pattern
        bookings_by_pattern = {}
        
        for booking, instance, schedule, class_info in user_bookings:
            pattern_key = f"{schedule.id}_{schedule.day_of_week}_{schedule.start_time}"
            
            if pattern_key not in bookings_by_pattern:
                bookings_by_pattern[pattern_key] = {
                    'id': schedule.id,
                    'weekly_schedule_id': schedule.id,
                    'class_name': class_info.name,
                    'day_of_week': schedule.day_of_week,
                    'start_time': schedule.start_time.strftime('%H:%M'),
                    'end_time': schedule.end_time.strftime('%H:%M'),
                    'instructor': class_info.instructor,
                    'location': class_info.location if hasattr(class_info, 'location') else 'Studio Reform',
                    'upcoming_instances': [],
                    'total_bookings': 0
                }
            
            bookings_by_pattern[pattern_key]['upcoming_instances'].append({
                'instance_id': instance.id,
                'date': instance.date.isoformat(),
                'start_time': instance.start_time.strftime('%H:%M'),
                'end_time': instance.end_time.strftime('%H:%M')
            })
            bookings_by_pattern[pattern_key]['total_bookings'] += 1
        
        result = list(bookings_by_pattern.values())
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f'Get weekly bookings error: {str(e)}')
        return jsonify({'message': str(e)}), 500

# SIMPLIFIED VERSION - Makes start_date optional with sensible defaults
@app.route('/api/book-weekly-class', methods=['POST'])
@jwt_required()
def book_weekly_class():
    """Simplified weekly booking with sensible defaults"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        if 'weekly_schedule_id' not in data:
            return jsonify({'message': 'Missing required field: weekly_schedule_id'}), 400
        
        weekly_schedule_id = data['weekly_schedule_id']
        
        # Get schedule
        weekly_schedule = WeeklySchedule.query.get(weekly_schedule_id)
        if not weekly_schedule or not weekly_schedule.is_active:
            return jsonify({'message': 'Weekly schedule not found or inactive'}), 404
        
        # Check membership
        active_membership = UserMembership.query.filter(
            UserMembership.user_id == current_user_id,
            UserMembership.is_active == True,
            UserMembership.remaining_sessions > 0
        ).first()
        
        if not active_membership:
            return jsonify({
                'message': 'You need an active membership with remaining sessions to book recurring classes',
                'requires_membership': True
            }), 400
        
        # Determine how many sessions to book
        if 'weeks' in data:
            weeks_to_book = min(int(data['weeks']), active_membership.remaining_sessions, 52)  # Max 1 year
        else:
            # Book all available sessions (max 12 weeks)
            weeks_to_book = min(active_membership.remaining_sessions, 12)
        
        if weeks_to_book <= 0:
            return jsonify({'message': 'No sessions available to book'}), 400
        
        # Determine start date
        if 'start_date' in data:
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        else:
            # Start from next week
            start_date = datetime.now().date() + timedelta(days=7)
        
        # Calculate end date
        end_date = start_date + timedelta(days=(weeks_to_book * 7) - 1)
        
        # Day mapping
        day_mapping = {'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
                      'Friday': 4, 'Saturday': 5, 'Sunday': 6}
        
        target_day = day_mapping.get(weekly_schedule.day_of_week)
        if target_day is None:
            return jsonify({'message': 'Invalid day of week'}), 400
        
        # Find first occurrence after start date
        current_date = start_date
        days_until = (target_day - current_date.weekday()) % 7
        if days_until > 0:
            current_date += timedelta(days=days_until)
        
        # Book the sessions
        bookings_created = 0
        for week in range(weeks_to_book):
            # Create or get instance
            instance = ScheduleInstance.query.filter_by(
                weekly_schedule_id=weekly_schedule_id,
                date=current_date
            ).first()
            
            if not instance:
                instance = ScheduleInstance(
                    weekly_schedule_id=weekly_schedule_id,
                    class_id=weekly_schedule.class_id,
                    date=current_date,
                    start_time=weekly_schedule.start_time,
                    end_time=weekly_schedule.end_time,
                    max_capacity=weekly_schedule.max_capacity
                )
                db.session.add(instance)
                db.session.flush()
            
            # Check capacity
            if instance.current_bookings >= instance.max_capacity:
                # Skip this date if full, continue with next week
                current_date += timedelta(days=7)
                continue
            
            # Create booking
            booking = ClassBooking(
                user_id=current_user_id,
                schedule_instance_id=instance.id,
                status='booked'
            )
            
            instance.current_bookings += 1
            active_membership.used_sessions += 1
            active_membership.remaining_sessions -= 1
            
            db.session.add(booking)
            bookings_created += 1
            
            # Next week
            current_date += timedelta(days=7)
        
        # Update membership status
        if active_membership.remaining_sessions <= 0:
            active_membership.is_active = False
        
        db.session.commit()
        
        return jsonify({
            'message': f'Booked {bookings_created} sessions successfully!',
            'bookings_created': bookings_created,
            'remaining_sessions': active_membership.remaining_sessions,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f'Book weekly class error: {str(e)}')
        return jsonify({'message': str(e)}), 500

@app.route('/api/cancel-weekly-booking/<int:weekly_schedule_id>', methods=['POST'])
@jwt_required()
def cancel_weekly_booking(weekly_schedule_id):
    """Cancel all future bookings for a weekly schedule pattern"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Get weekly schedule
        weekly_schedule = WeeklySchedule.query.get(weekly_schedule_id)
        if not weekly_schedule:
            return jsonify({'message': 'Weekly schedule not found'}), 404
        
        # Get all future bookings for this user and weekly schedule
        future_bookings = db.session.query(
            ClassBooking, ScheduleInstance
        ).join(
            ScheduleInstance, ClassBooking.schedule_instance_id == ScheduleInstance.id
        ).filter(
            ClassBooking.user_id == current_user_id,
            ScheduleInstance.weekly_schedule_id == weekly_schedule_id,
            ScheduleInstance.date >= datetime.now().date(),
            ClassBooking.status == 'booked'
        ).all()
        
        if not future_bookings:
            return jsonify({'message': 'No future bookings found for this schedule'}), 404
        
        # Get class info for SMS
        class_info = Class.query.get(weekly_schedule.class_id)
        
        # Cancel each booking and refund sessions
        refunded_sessions = 0
        for booking, instance in future_bookings:
            booking.status = 'cancelled'
            booking.cancelled_at = datetime.now(timezone.utc)
            
            # Decrement instance bookings
            instance.current_bookings -= 1
            
            # Refund session to user membership
            active_membership = UserMembership.query.filter_by(
                user_id=current_user_id,
                is_active=True
            ).first()
            
            if active_membership:
                active_membership.used_sessions -= 1
                active_membership.remaining_sessions += 1
                refunded_sessions += 1
                
                # Reactivate if needed
                if not active_membership.is_active and active_membership.remaining_sessions > 0:
                    active_membership.is_active = True
        
        db.session.commit()
        
        # Send cancellation SMS
        try:
            if user.phone:
                message = f"""❌ Weekly Booking Cancelled
    
Class: {class_info.name if class_info else 'Class'}
Day: {weekly_schedule.day_of_week}
Time: {weekly_schedule.start_time.strftime('%I:%M %p')}
    
All future bookings have been cancelled.
{refunded_sessions} session(s) refunded to your account.
    
Remaining Sessions: {active_membership.remaining_sessions if active_membership else 0}
    
We hope to see you again soon!"""
                send_sms(user.phone, message)
        except Exception as sms_error:
            logger.error(f"Cancellation SMS failed: {sms_error}")
        
        return jsonify({
            'message': f'Weekly booking cancelled successfully. {refunded_sessions} session(s) refunded.',
            'cancelled_bookings': len(future_bookings),
            'refunded_sessions': refunded_sessions,
            'remaining_sessions': active_membership.remaining_sessions if active_membership else 0
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f'Cancel weekly booking error: {str(e)}')
        return jsonify({'message': str(e)}), 500

# ===================================================================
# ============================================================================

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
            # required_tables = ['srusers', 'class', 'booking', 'contact', 'class_schedule', 'chat_history', 'package_config']
            
            required_tables = [
                'srusers', 
                'class', 
                'booking', 
                'contact', 
                'class_schedule', 
                'chat_history', 
                'package_config',
                'weekly_schedule',  # Add this
                'schedule_instance', # Add this
                'class_booking',     # Add this
                'user_membership'    # Add this
            ]
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
                            'capacity': 4,
                            'description': 'A return to classical Pilates. Precise, grounded, and methodical — ROOT follows the traditional reformer sequence focusing on control, alignment, and flow.',
                            'image_url': '../images/Foudation.png'
                        },
                        {
                            'name': 'Reform I (Signature, Full Body)',
                            'instructor': 'Studio Reform',
                            'duration': '50 min',
                            'difficulty': 'All Levels',
                            'capacity': 4,
                            'description': 'The signature Studio Reform experience. A full-body reformer flow that merges strength, elongation, and balance.',
                            'image_url': '../images/Foundamental.png'
                        },
                        {
                            'name': 'Reform II (Abs, Booty, Core)',
                            'instructor': 'Studio Reform',
                            'duration': '55 min',
                            'difficulty': 'Intermediate',
                            'capacity': 4,
                            'description': 'The sculpting phase. Focus on the ABC\'s. A focused reformer class targeting abs, booty, and core through deeper resistance and endurance sequences.',
                            'image_url': '../images/transitional.png'
                        },
                        {
                            'name': 'Rhythm (Jumpboard)',
                            'instructor': 'Studio Reform',
                            'duration': '55 min',
                            'difficulty': 'All Levels',
                            'capacity': 4,
                            'description': 'A dynamic reformer flow with jumpboard integration. Low-impact bursts that challenge coordination and control while maintaining form and precision.',
                            'image_url': '../images/advance.png'
                        },
                        {
                            'name': 'Repose (Stretch)',
                            'instructor': 'Studio Reform',
                            'duration': '50 min',
                            'difficulty': 'All Levels',
                            'capacity': 4,
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