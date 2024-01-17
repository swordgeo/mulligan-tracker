function clearData() {
  fetch('/clear', {method: 'POST'})
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        document.getElementById('gameNumber').textContent = 1;
        document.getElementById('currentMulligan').textContent = 0;
        document.getElementById('currentKeep').textContent = 7;
        const resetData = [];
        updateGraph(resetData);
        updateStats(resetData);
      }
    });
}


function keepHand() {
  fetch('/keep-hand', { method: 'POST' })
    .then(response => {
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
          document.getElementById('gameNumber').textContent = data.game_number;
          document.getElementById('currentMulligan').textContent = data.mulligan_count;
          document.getElementById('currentKeep').textContent = data.keep_count;
          updateGraph(data.mulligan_data);
          updateStats(data.mulligan_data);

          // console.log(data);
          if (data.current_hand) {
            dealHand(data.current_hand);
          }
      });
}

function mulliganHand() {
  fetch('/mulligan', { method: 'POST' })
    .then(response => {
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
          // Update the UI based on the response
          // For example, update mulligan count if you're displaying it
          document.getElementById('currentMulligan').textContent = data.mulligan_count;
          document.getElementById('currentKeep').textContent = data.keep_count;

          // console.log(data);
          if (data.current_hand) {
            dealHand(data.current_hand);
          }
      });
}


let myChart; // Global variable to hold the chart instance

function updateGraph(mulliganData) {
    const ctx = document.getElementById('mulliganChart').getContext('2d');
    const labels = mulliganData.map((_, index) => `Game ${index + 1}`);
    const data = mulliganData.map(entry => entry);

    if (myChart) {
        // Update data and labels
        myChart.data.labels = labels;
        myChart.data.datasets[0].data = data;
        myChart.update();
    } else {
        
        // Create chart
        myChart = new Chart(ctx, {
            type: 'line',  // or 'bar' for a bar chart
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Mulligans',
                    data: data,
                    backgroundColor: 'rgba(0, 123, 255, 0.5)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1, // Sets the step size to 1
                          precision: 0, // Ensures no decimal values
                          suggestedMax: 6 // Suggests a maximum value of 6
                        }
                    }
                },
                maintainAspectRatio: false, // Set to false to allow custom aspect ratio
                // responsive: true // Ensure the chart is responsive
            }
        });
    }
}


function updateStats(mulliganData) {
  // Initialize counts
  let counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  
  // Count occurrences of each mulligan number
  mulliganData.forEach(num => {
      if (counts.hasOwnProperty(num)) {
          counts[num]++;
      }
  });

  // Update the counts in the HTML
  for (let i = 0; i <= 7; i++) {
      document.getElementById('mull' + i).textContent = counts[i];
  }

  // if (mulliganData == []) {
  //   for (let i = 0; i <= 7; i++) {
  //     document.getElementById('mull' + i).textContent = 0;
  // }
  // }


  // Calculate the mean
  const mean = mulliganData.reduce((acc, cur) => acc + cur, 0) / mulliganData.length;
  document.getElementById('mullRatio').textContent = mean.toFixed(2); // Rounds to 2 decimal places

  if (mulliganData == []) {
    document.getElementById('mullRatio').textContent = 0;
  }
}


// Event listener for DOMContentLoaded to ensure the DOM is fully loaded before running scripts
document.addEventListener('DOMContentLoaded', function() {
  updateGraph(mulliganData);
});


window.addEventListener('resize', function() {
  if (myChart) {
      myChart.resize();
  }
});



document.getElementById('decklistForm').addEventListener('submit', function(e) {
  e.preventDefault(); // Prevents the default form submission

  // Get the decklist value from the form
  var decklist = this.elements['decklist'].value;

  // Create an AJAX request to the /submit-decklist route
  fetch('/submit-decklist', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'decklist=' + encodeURIComponent(decklist)
  })
  .then(response => response.json())
  .then(data => {

      // console.log(data);
      // Update the page with the response data
      // For example, update current_hand and deck display
      document.getElementById('deck-length').textContent = data.deck_length;

      // console.log(data.current_hand);

      dealHand(data.current_hand);
      // .textContent = data.current_hand;
      // ... other DOM updates based on 'data.deck'
  })
  .catch(error => {
      console.error('Error:', error);
  });
});

function dealHand(currentHand) {
  const handDiv = document.getElementById('hand-display');
  handDiv.innerHTML = '';
  for (card of currentHand) {
    const li = document.createElement('li');
    li.innerHTML += `<img class="card" src="${card.image_url}" alt="Image of card ${card.image_url}"><br><span class="card-name">${card.name}</span>`;
    handDiv.appendChild(li);
  }
}