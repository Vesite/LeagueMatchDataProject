import React, { useEffect, useRef, useState } from 'react';


const CSVLoader: React.FC = () => {
  const [fileName, setFileName] = useState<string>('');
  
  const [csvDataAll, setCSVDataAll] = useState<string[][]>([]); // This is all csv data
  const [csvDataDupFiltered, setCSVDataDupFiltered] = useState<string[][]>([]); // This is all csv data but only 1 entry per game
  const [selectedDataAll, setSelectedDataAll] = useState<string[][]>([]); // This is all csv data selected
  const [selectedDataDupFiltered, setSelectedDataDupFiltered] = useState<string[][]>([]); // This is all csv data selected
  
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [uniqueLeagues, setUniqueLeagues] = useState<string[]>([]); // This is all the unique leagues (for buttons)
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]); // This is all leagues currently selected
  
  const [headerRow, setHeaderRow] = useState<string[]>([]); // Initialize headerRow as an empty array
  
  const [championNameInputString, setChampionNameInputString] = useState('');


  const [messages, setMessages] = useState<string[]>([]); // For the users web page text-area
  // Makes a connection/reference to the text-area ui thing
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const columnsToView = ["datacompleteness", "league", 'split', "date", 'patch', "gamelength", "kills", "deaths"];


  // Will load the file when we click the first load CSV button. Setting many relevant variables
  const loadCSVData = async () => {
    try {

      const formattedFileName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
      const response = await fetch(`/public/${formattedFileName}`);
      const csvText = await response.text();
      // Parse CSV text into a 2D array
      const parsedCSV = csvText.split('\n').map(row => row.split(','));

      const headerRow = parsedCSV.shift() || []; // Remove and retrieve the first row
      setHeaderRow(headerRow);

      setCSVDataAll(parsedCSV)

      // Basic Filtering
      // Remove all rows where participantid !== 100
      const participantIdIndex: number = headerRow.indexOf("participantid");
      const filteredData = parsedCSV.filter(row => row[participantIdIndex] === '100');

      setCSVDataDupFiltered(filteredData);
      setIsLoaded(true); // Set isLoaded to true when CSV data is loaded

      // Extract unique values from the "league" column, to make my buttons
      const leagueIdIndex: number = headerRow.indexOf("league");
      const leaguesColumn = filteredData.map(row => row[leagueIdIndex]);
      const uniqueValues = Array.from(new Set(leaguesColumn.filter(league => league !== '' && league !== 'league' && league !== ' ')));
      //Sort the array
      uniqueValues.sort();
      setUniqueLeagues(uniqueValues);

    } catch (error) {
      console.error('Error loading CSV file:', error);
    }
  };

  // This runs when clicking submit on our file path
  const handleSubmitCSV = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); //idk
    loadCSVData();
  };
  









  // Champion Button
  //------------------------------------------------------------------------------------------------------

  // Will print relevant data about the champion
  const handleSubmitChampion = () => {
    
    if (selectedDataAll.length <= 0) { return }

    let championNameArray = championNameInputString.split(',').map(value => value.trim());

    let selectedChampionsData: string[][] = [];
    let amountOfGames = 0
    const ID_INDEX_champion = getIndex("champion");

    for (let i = 0; i < championNameArray.length; i++) {
      
      let championNameSingle = championNameArray[i]
      console.log("name: ", championNameSingle)

      // Here i want to type how many games that champion were in
      // Filter the "csvDataAll"
      // Basically look at the "champion" column (index ID_INDEX_champion) and look for the "championName"
      // if we find it increase amountOfGames by one and add the row to selectedChampionData
      selectedDataAll.forEach(row => {
        if (row[ID_INDEX_champion] === championNameSingle) {
            amountOfGames++;
            selectedChampionsData.push(row);
        }
      });

    }

    let average_duration = getAverageGameTime(selectedChampionsData)
    let average_time_string = formatTime(average_duration)
    let average_kills = getAverageGameKills(selectedChampionsData)
    let wr = getAverageWR(selectedChampionsData)

    let log_string = `${championNameArray} has ${amountOfGames} Games Played`
    if (amountOfGames > 0) {
      log_string += `, Average Game Duration: ${average_time_string}`;
      log_string += `, Average Game Kills: ${average_kills}`
      log_string += `, Average WR: ${wr}`
    }
    log_string += ` - In Regions [${selectedLeagues.join(', ')}]`
    logMessage(log_string)
    
  };

  const handleChangeChampion = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setChampionNameInputString(value);
  };

  //------------------------------------------------------------------------------------------------------







  /**
   * Calculates the average game time in the input data.
   * 
   * @param {string[][]} inputGameData - The input game data
   * @returns {number} The average game time in seconds
   */
  function getAverageGameTime(inputGameData: string[][]): number {
    if (inputGameData.length <= 0) { return -1 }

    const ID_INDEX_gamelength = getIndex("gamelength");

    let total_time = 0
    // Add together the total
    for (let i = 0; i < inputGameData.length; i++) {
      total_time += parseInt(inputGameData[i][ID_INDEX_gamelength])
    }

    return Math.round((total_time / inputGameData.length));
  }

  /**
   * Calculates the average kills in the input data.
   * 
   * @param {string[][]} inputGameData - The input game data
   * @returns {number} The average kills
   */
  function getAverageGameKills(inputGameData: string[][]): number {
    
    if (inputGameData.length <= 0) { return -1 }

    const ID_INDEX_kills = getIndex("teamkills");
    const ID_INDEX_deaths = getIndex("teamdeaths");

    let total_kills = 0
    // Add the total kills and deaths
    for (let i = 0; i < inputGameData.length; i++) {
      total_kills += parseInt(inputGameData[i][ID_INDEX_kills])
      total_kills += parseInt(inputGameData[i][ID_INDEX_deaths])
    }

    return parseFloat((total_kills / inputGameData.length).toFixed(2));
    
  }

  /**
   * Calculates the average win-rate in the input data.
   * 
   * @param {string[][]} inputGameData - The input game data
   * @returns {number} The average win-rate
   */
  function getAverageWR(inputGameData: string[][]): number {
    
    if (inputGameData.length <= 0) { return -1 }

    const ID_INDEX_result = getIndex("result");

    let total_wins = 0
    for (let i = 0; i < inputGameData.length; i++) {
      total_wins += parseInt(inputGameData[i][ID_INDEX_result])
    }

    return parseFloat((total_wins / inputGameData.length).toFixed(2));
    
  }

  










  /**
   * Gives the index of the column with the input name 
   * 
   * @param columnName Column Name
   * @returns Column Index
   */
  function getIndex(columnName: string): number {
    let index = headerRow.indexOf(columnName);
    return index
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
  }










  // Text Area
  //------------------------------------------------------------------------------------------------------

  /**
     * Logs the input string to the text area
     * 
     * @param message Message String
     * @returns void
     */
  function logMessage(message: string) {
    // Add the new message to the list of messages
    setMessages(prevMessages => [...prevMessages, message]);
  };

  const clearTextArea = () => {
    setMessages([]);
  }

  useEffect(() => {
    // Automatically scroll textarea to the bottom when messages change
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [messages]);

  //------------------------------------------------------------------------------------------------------











  


  const getSelectedLeagues = (league: string) => {

    let prevLeagues = selectedLeagues
    let newLeagues;
      // Check if the league is already selected
      if (prevLeagues.includes(league)) {
        // If it's already selected, remove it
        newLeagues = prevLeagues.filter(item => item !== league);
      } else {
        // If it's not selected, add it
        newLeagues = [...prevLeagues, league];
      }
      // Return the new array for state update
      console.log("newLeagues", newLeagues)
      
      return newLeagues;
  }

  // Changes our data variables when toggle clicking the button
  // This system became kind of a mess because the "set..." functions does not update instantly
  const toggleLeague = (league: string) => {

    let temp = getSelectedLeagues(league)
    setSelectedLeagues(temp)
    handlePrintData(temp);

  };
  
  // Changes our selected data variables to make the printed data change.
  const handlePrintData = (argSelectedLeagues: string[]) => {

    // Filter CSV data based on selected leagues
    const ID_INDEX_league = getIndex("league");

    const filteredDataDupFiltered = csvDataDupFiltered.filter(row => argSelectedLeagues.includes(row[ID_INDEX_league])); // Assuming league column is at index 3
    const fulteredDataAll = csvDataAll.filter(row => argSelectedLeagues.includes(row[ID_INDEX_league]))

    setSelectedDataDupFiltered(filteredDataDupFiltered);
    setSelectedDataAll(fulteredDataAll)
  };

  


















  // Final Click Buttons & Calculate/Display Stuff Functions
  //------------------------------------------------------------------------------------------------------

  const ClickDisplayAverageKills = () => {

    if (selectedDataDupFiltered.length <= 0) { return }

    let averageKills = getAverageGameKills(selectedDataDupFiltered)

    // uses "selectedLeagues" array and average varaibles to display data
    logMessage(`Average Kills: ${averageKills} - In Regions [${selectedLeagues.join(', ')}]`)

  }

  const ClickDisplayAverageTime = () => {

    if (selectedDataDupFiltered.length <= 0) { return }

    let averageTime1 = getAverageGameTime(selectedDataDupFiltered)

    // Convert the time from seconds to minutes
    let averageTime2 = formatTime(averageTime1)

    // uses "selectedLeagues" array and average varaibles to display data
    logMessage(`Average Game Duration: ${averageTime2} - In Regions [${selectedLeagues.join(', ')}]`)

  }

  const calculateCommonChancesTime = () => {
    
    if (selectedDataDupFiltered.length <= 0) { return }
    logMessage("-----")

    const ID_INDEX_gamelength = getIndex("gamelength");
    let times_array_minutes = [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]

    for (let minutes = times_array_minutes[0]; minutes <= times_array_minutes[0] + times_array_minutes.length - 1; minutes++) {
      
      // Basically i need the array of all the time values for the selected games
      let compareTime = minutes*60
      let shorterGames = 0
      let longerGames = 0
      const gameDurationColumn = selectedDataDupFiltered.map(row => row[ID_INDEX_gamelength]);
      const durationsAsNumbers = gameDurationColumn.map(duration => parseInt(duration, 10));
      durationsAsNumbers.forEach(duration => {
        if (duration < compareTime) {
            // Value is smaller than compareTime
            shorterGames += 1
        } else {
            // Value is greater than or equal to compareTime
            longerGames += 1
        }
      });

      // Get the % Chance the game is shorter
      let shorterChance = Math.round((shorterGames/durationsAsNumbers.length)*100);
      let longerChance = Math.round((longerGames/durationsAsNumbers.length)*100);

      logMessage(`The average game in the regions [${selectedLeagues.join(', ')}] has a ${shorterChance}% chance to be shorter than ${minutes} minutes and a ${longerChance}% chance to be longer`)

    }

  }

  const calculateCommonChancesKills = () => {
    
    if (selectedDataDupFiltered.length <= 0) { return }
    logMessage("-----")

    const ID_INDEX_kills = getIndex("kills");
    const ID_INDEX_deaths = getIndex("deaths");
    let kills_array = [21.5, 22.5, 23.5, 24.5, 25.5, 26.5, 27.5, 28.5, 29.5, 30.5, 31.5, 32.5]

    for (let i = 0; i <= kills_array.length - 1; i++) {
      
      let kills_from_array_compare = kills_array[i]

      let less_kills = 0
      let more_kills = 0

      // get an array that has the amount of kills each game as each entry
      const gameKillsColumn = selectedDataDupFiltered.map(row => parseInt(row[ID_INDEX_kills], 10) + parseInt(row[ID_INDEX_deaths], 10));
      
      gameKillsColumn.forEach(kills => {
        if (kills > kills_from_array_compare) {
            // Value is smaller than compareTime
            more_kills += 1
        } else {
            // Value is greater than or equal to compareTime
            less_kills += 1
        }
      });

      // Calculate the chance the game is shorter
      let lessChance = Math.round((less_kills/gameKillsColumn.length)*100);
      let moreChance = Math.round((more_kills/gameKillsColumn.length)*100);

      logMessage(`The average game in the regions [${selectedLeagues.join(', ')}] has a ${lessChance}% chance to have less than ${kills_from_array_compare} kills and a ${moreChance}% chance to have more`)

    }

  }

  //------------------------------------------------------------------------------------------------------























  //------------------------------------------------------------------------------------------------------

  return (
    <div>
      <form onSubmit={handleSubmitCSV}>
        <label>
          Enter the name of the CSV file in the "public" folder 
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            style={{ width: '400px' }}
          />
        </label>
        <button type="submit">Load CSV</button>
      </form>
      {isLoaded && <p>CSV loaded - {csvDataDupFiltered.length} Games</p>}
      {uniqueLeagues.map((league, index) => (
        <button
          key={index}
          onClick={() => toggleLeague(league)}
          style={{ backgroundColor: selectedLeagues.includes(league) ? 'green' : 'gray' }}
        >
          {league}
        </button>
      ))}
      <p>Selected Leagues: {selectedLeagues.join(', ')}, Total Games: {selectedDataDupFiltered.length}</p>
      <div>
        <button onClick={ClickDisplayAverageKills}>Calculate Average Kills</button>
        <button onClick={ClickDisplayAverageTime}>Calculate Average Game Duration</button>
      </div>
      <div>
        <button onClick={calculateCommonChancesKills}>Calculate Common Kills Chances</button>
        <button onClick={calculateCommonChancesTime}>Calculate Common Duration Chances</button>
      </div>
      <div>
      <input
        type="text"
        value={championNameInputString}
        disabled={false}
        readOnly={false}
        onChange={handleChangeChampion}
        placeholder="Enter champion names, comma seperated"
      />
      <button onClick={handleSubmitChampion}>Submit</button>
    <div>
    <button onClick={clearTextArea}>Clear</button>
    </div>
    </div>
      <textarea
        ref={textareaRef}
        rows={10}
        cols={80}
        value={messages.join('\n')} // Display all messages as a single string
        readOnly // Make the textarea read-only
      />

      {/* <button onClick={handlePrintData}>Print Selected Data</button> */}
      {selectedDataDupFiltered.length > 0 && (
        <table>
          <thead>
              <tr>
                  {columnsToView.map((columnName, columnIndex) => (
                      <th key={columnIndex}>{columnName}</th>
                  ))}
              </tr>
          </thead>
          <tbody>
              {selectedDataDupFiltered.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                      {columnsToView.map((columnName, columnIndex) => (
                          <td key={columnIndex}>
                              {row[headerRow.indexOf(columnName)] !== "" ? row[headerRow.indexOf(columnName)] : "-"}
                          </td>
                      ))}
                  </tr>
              ))}
          </tbody>
        </table>
      )}
      
    </div>
  );
};

export default CSVLoader;

//------------------------------------------------------------------------------------------------------




