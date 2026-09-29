from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
import os

# PERUBAHAN DI SINI: static_folder diubah jadi '.' (titik)
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/nova")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(20), unique=True, nullable=False)
    nama = db.Column(db.String(100), nullable=False)
    umur = db.Column(db.Integer, nullable=False)
    tahun_lahir = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "nama": self.nama,
            "umur": self.umur,
            "tahun_lahir": self.tahun_lahir,
            "created_at": self.created_at.isoformat(),
        }


def generate_user_id():
    unique = uuid.uuid4().hex[:6].upper()
    return f"NOVA-{unique}"


with app.app_context():
    db.create_all()


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    nama = data.get("nama", "").strip()
    umur = data.get("umur")
    tahun_lahir = data.get("tahun_lahir")

    if not nama or not umur or not tahun_lahir:
        return jsonify({"error": "Semua field harus diisi!"}), 400

    user_id = generate_user_id()
    while User.query.filter_by(user_id=user_id).first():
        user_id = generate_user_id()

    new_user = User(
        user_id=user_id,
        nama=nama,
        umur=int(umur),
        tahun_lahir=int(tahun_lahir),
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Registrasi berhasil!", "user": new_user.to_dict()}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    user_id = data.get("user_id", "").strip().upper()
    user = User.query.filter_by(user_id=user_id).first()

    if not user:
        return jsonify({"error": "ID tidak ditemukan!"}), 404

    return jsonify({"message": "Login berhasil!", "user": user.to_dict()}), 200


@app.route("/api/stats", methods=["GET"])
def stats():
    total = User.query.count()
    return jsonify({"total_users": total}), 200


@app.route("/")
def index():
    # PERUBAHAN DI SINI: mencari public.html, bukan index.html
    return send_from_directory(app.static_folder, 'public.html')


if __name__ == "__main__":
    app.run(debug=True)
