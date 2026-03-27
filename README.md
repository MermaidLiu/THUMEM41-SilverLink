Backend:
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
Frontend:
copy .env.example .env
npm install
npm run dev:h5
