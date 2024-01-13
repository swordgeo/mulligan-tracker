from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from os import urandom

app = Flask(__name__)
app.secret_key = urandom(24) #generate random session key



@app.route('/')
def index():
    if 'game_number' not in session:
        session['game_number'] = 1
        session['mulligan_count'] = 0
        session['mulligan_data'] = []
    return render_template('index.html', game_number=session['game_number'], mulligan_count=session['mulligan_count'])

@app.route('/keep-hand', methods=['POST'])
def keep_hand():
    # If someone goes past the limit, ignore the results
    if session['mulligan_count'] > 7:
        session['mulligan_count'] = 0
        return jsonify(game_number=session['game_number'], 
                   mulligan_count=session['mulligan_count'],
                   mulligan_data=session['mulligan_data']
                  )
    session['mulligan_data'].append(session['mulligan_count'])
    session['game_number'] += 1
    session['mulligan_count'] = 0
    print(session['mulligan_data'])
    return jsonify(game_number=session['game_number'], 
                   mulligan_count=session['mulligan_count'],
                   mulligan_data=session['mulligan_data']
                  )


@app.route('/mulligan', methods=['POST'])
def mulligan():
    session['mulligan_count'] += 1
    return jsonify(game_number=session['game_number'], 
                   mulligan_count=session['mulligan_count']
                  )

if __name__ == '__main__':
    app.run(debug=True, port=3000)