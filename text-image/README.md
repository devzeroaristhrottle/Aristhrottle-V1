### To test locally, run the following command in the bash:
python -m uvicorn PIPELINE.main:app --host 127.0.0.1 --port 8000 --reload


### now wait patiently till u see 
"Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)"


### open a new bash and run the following
Invoke-RestMethod `
  -Uri 'http://127.0.0.1:8000/api/v1/images/generate' `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{
    "title": "Moonlit Samurai", 
    "tags": ["mystical","cherry blossoms","dramatic lighting","cinematic"],
    "filename": "samurai.png"
  }'

  #### Note : change the title and tags accordingly
