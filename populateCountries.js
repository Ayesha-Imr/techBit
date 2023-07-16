/*
Explanation:
This JavaScript code populates a dropdown menu with a list of countries. It listens for the DOMContentLoaded event to ensure that the HTML document has finished loading before executing the code.

The code fetches the content of a text file named 'countries.txt' using the Fetch API. It then processes the retrieved data to extract individual country names and populates the dropdown menu with corresponding options.

The event listener ensures that the code is executed when the DOM is ready, and the fetch function is used to retrieve the content of the 'countries.txt' file. The response is converted to text format and then processed to create option elements for each country. Finally, the options are added to the country dropdown menu.

In case of any error during the fetch operation, the code logs an error message to the console.

*/

window.addEventListener('DOMContentLoaded', function() {
  var countryDropdown = document.getElementById('country');

  // Fetch the countries from the text file
  fetch('countries.txt')
    .then(function(response) {
      return response.text();
    })
    .then(function(data) {
      // Split the text file content into an array of country names
      var countries = data.trim().split('\n');

      // Populate the dropdown menu with options
      countries.forEach(function(country) {
        var option = document.createElement('option');
        option.text = country;
        countryDropdown.add(option);
      });
    })
    .catch(function(error) {
      console.log('Error fetching countries:', error);
    });
});
