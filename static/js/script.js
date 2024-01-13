function keepHand() {
  fetch('/keep-hand', { method: 'POST' })
      .then(response => response.json())
      .then(data => {
          document.getElementById('gameNumber').textContent = data.game_number;
          document.getElementById('currentMulligan').textContent = data.mulligan_count;
          updateGraph(data.mulligan_data);
          updateStats(data.mulligan_data);
      });
}

function mulliganHand() {
  fetch('/mulligan', { method: 'POST' })
      .then(response => response.json())
      .then(data => {
          // Update the UI based on the response
          // For example, update mulligan count if you're displaying it
          document.getElementById('currentMulligan').textContent = data.mulligan_count;
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

  // Calculate the mean
  const mean = mulliganData.reduce((acc, cur) => acc + cur, 0) / mulliganData.length;
  document.getElementById('mullRatio').textContent = mean.toFixed(2); // Rounds to 2 decimal places
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