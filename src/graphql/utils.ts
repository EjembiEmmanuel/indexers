export function getClosePriceAtTimestamp(quotes: any[], timeSeconds: number) {
    const targetDate = new Date(timeSeconds * 1000); // Convert timestamp to milliseconds and create Date object
  
    // Normalize targetDate to the start of the day (00:00:00)
    targetDate.setUTCHours(0, 0, 0, 0);
  
    // Find the quote with a date that matches the start of the day
    const matchingQuote = quotes.find(quote => {
      const quoteDate = new Date(quote.date);
      quoteDate.setUTCHours(0, 0, 0, 0); // Normalize quoteDate to start of the day
      return quoteDate.getTime() === targetDate.getTime();
    });
  
    // Return the close price if a matching quote was found, else return null or a default value
    return matchingQuote ? matchingQuote.close : null;
  }