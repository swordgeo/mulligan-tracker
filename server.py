from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_session import Session
from dotenv import load_dotenv
import os
import re
import requests
import random


load_dotenv()
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)


# Backend Routes

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

    # if we have a deck, reshuffle and deal a new hand along with everything else
    if 'deck' in session:
      session['current_hand'] = shuffle_and_deal(session['deck'])
      # print(session['current_hand'])
      return jsonify(game_number=session['game_number'], 
                    mulligan_count=session['mulligan_count'],
                    mulligan_data=session['mulligan_data'],
                    current_hand=session['current_hand']
                  )
    else :
      return jsonify(game_number=session['game_number'], 
                    mulligan_count=session['mulligan_count'],
                    mulligan_data=session['mulligan_data']
                    )


@app.route('/mulligan', methods=['POST'])
def mulligan():
    session['mulligan_count'] += 1

    # if we have a deck, reshuffle and deal a new hand along with everything else
    if 'deck' in session:
      session['current_hand'] = shuffle_and_deal(session['deck'])
      # print(session['current_hand'])
      return jsonify(game_number=session['game_number'], 
                    mulligan_count=session['mulligan_count'],
                    current_hand=session['current_hand']
                  )
    else :
      return jsonify(game_number=session['game_number'], 
                    mulligan_count=session['mulligan_count']
                    )

              


@app.route('/clear', methods=['POST'])
def clear():
  session['game_number'] = 1
  session['mulligan_count'] = 0
  session['mulligan_data'] = []
  return jsonify(success=True)


@app.route('/submit-decklist', methods=['POST'])
def submit_decklist():
    decklist_str = request.form['decklist']
    # print(decklist_str)
    decklist = parse_decklist(decklist_str)
    # print(decklist)
    # Split the decklist into chunks and fetch images for each chunk
    deck_chunks = split_into_chunks(decklist)
    full_deck = []
    for chunk in deck_chunks:
        chunk_with_images = fetch_card_images(chunk)
        full_deck.extend(chunk_with_images)  # Combine the results
    # full_deck now contains the combined results of all chunks
    # print(full_deck)
    session['deck'] = full_deck
    session['current_hand'] = shuffle_and_deal(full_deck)
    session['deck_length'] = len(full_deck)

    # print(session['current_hand'])

    # return 'Decklist submitted'
    return jsonify(current_hand=session['current_hand'], 
                   deck_length=session['deck_length']
                  )

# End of Routes



#Functions

def parse_decklist(decklist_str):
    decklist = []
    lines = decklist_str.strip().split('\n')
    for line in lines:
        #strip carriage return if exists
        line = line.replace('\r', '').strip()

        #for double faced cards, we must only search using the first half of the name, and not use the set code
        #therefore we trim off the entire rest of the entry besides the first half of the name
        if '//' in line:
            line = line.split('//')[0].strip()

        # Updated regular expression
        match = re.match(r'(\d+)\s+(.+?)(?:\s+\((\w+)\)\s+(\d+))?$', line)
        if match:
            count, name, set_code, set_number = match.groups()
            count = int(count)  # Convert count to an integer
            if set_code and set_number:
                # Format with set code and number
                decklist.append((name, set_code, set_number, count))
            else:
                # Format with only card name
                decklist.append((name, count))
    return decklist


#Scryfall API only likes 75 cards at a time. So this is how we cheat it
def split_into_chunks(decklist, chunk_size=75):
    """Split a list into chunks of a specified size."""
    for i in range(0, len(decklist), chunk_size):
        yield decklist[i:i + chunk_size]


def fetch_card_images(decklist):
    # Prepare the identifiers for the API call
    identifiers = []
    for card in decklist:
        if len(card) == 4:  # Format with set code and number
            name, set_code, set_number, count = card
            identifiers.append({"set": set_code, "collector_number": set_number})
        else:  # Format with only card name
            name, count = card
            identifiers.append({"name": name})

    # Make the API request
    # print(identifiers)
    response = requests.post('https://api.scryfall.com/cards/collection', json={"identifiers": identifiers})
    deck_with_images = []
    if response.status_code == 200:
        cards_data = response.json()['data']
        # print(cards_data)
        for card_data, card_info in zip(cards_data, decklist):
            # print(card_info)
            if 'card_faces' in card_data: #if this is a double sided card
                #go inside card_faces to find our image
                image_url = card_data['card_faces'][0]['image_uris']['normal'] if 'image_uris' in card_data['card_faces'][0] else None
            else:
                image_url = card_data['image_uris']['normal'] if 'image_uris' in card_data else None
            # deck_with_images.append({'name': card_info[0], 'image_url': image_url, 'count': card_info[-1]})
                
            #add to the deck as many copies we need
            for i in range(card_info[-1]):
              deck_with_images.append({'name': card_data['name'], 'image_url': image_url})
                
    else:
        # Handle errors
        print(f"Failed to fetch data: {response.status_code}")

    return deck_with_images


def shuffle_and_deal(deck):
    random.shuffle(deck)
    return deck[:7] #top seven cards


# def fetch_card_images(decklist):
#     identifiers = [{'name': card[0]} for card in decklist]  # Always using the name identifier

#     response = requests.post('https://api.scryfall.com/cards/collection', json={"identifiers": identifiers})
#     deck_with_images = []
#     if response.status_code == 200:
#         cards_data = response.json()['data']
#         for card_data, card_info in zip(cards_data, decklist):
#             # Handle double-sided cards
#             if 'card_faces' in card_data:
#                 image_url = card_data['card_faces'][0]['image_uris']['normal'] if 'image_uris' in card_data['card_faces'][0] else None
#             else:
#                 image_url = card_data['image_uris']['normal'] if 'image_uris' in card_data else None
            
#             deck_with_images.append({'name': card_info[0], 'image_url': image_url, 'count': card_info[-1]})
#     else:
#         print(f"Failed to fetch data: {response.status_code}")

#     return deck_with_images



if __name__ == '__main__':
    app.run(debug=True, port=3000)

