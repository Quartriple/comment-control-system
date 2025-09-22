from . import db

class User(db.Model):
    __tablename__ = 'user'

    idx = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    nickname = db.Column(db.String(80), unique=True, nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now(), nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'
