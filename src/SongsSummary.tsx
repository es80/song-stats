import React from 'react';
import Button from 'react-bootstrap/Button';
import Jumbotron from 'react-bootstrap/Jumbotron';
import { LyricData } from './types';


function songTotals(lyricData: LyricData): string {
  const total: number = lyricData.songs.size;

  let totalString: string;
  if (total === 0) {
    return "";
  } else if (total === 1) {
    totalString = "1 recording";
  } else {
    totalString = `${total} recordings`;
  }

  const instrumental: number = 
    Array.from(lyricData.songs.values()).filter(s => s.instrumental).length;

  let instrumentalString = "";
  if (instrumental === 1) {
    instrumentalString = "1 song is an instrumental."
  } else if (instrumental > 1) {
    instrumentalString = `${instrumental} songs are instrumentals.`
  }

  const found: number = 
    Array.from(lyricData.songs.values()).filter(s => s.lyricsState === "FOUND_LYRICS").length;

  return `Found lyrics for ${found - instrumental} out of ${totalString}. ${instrumentalString}`;
}


function wordStatistics(lyricData: LyricData): string[] {
  const found: number =
    Array.from(lyricData.songs.values()).filter(s => s.lyricsState === "FOUND_LYRICS").length;
  
  if (found === 0) {
    return ["", ""];
  }

  const totalWords = Array.from(lyricData.aggregateWordCount.values()).reduce((a, b) => a + b, 0);
  const average = totalWords / found;
  const uniqueWords = lyricData.aggregateWordCount.size;
  const averageUnique = uniqueWords / found;

  return [
    `The total number of words found is ${totalWords}, an average of ${average.toFixed(2)} ` + 
      `per song.`,
    `There are ${uniqueWords} unique words in the lyrics, an average of ` + 
      `${averageUnique.toFixed(2)} per song`
  ];
}


function wordTallyToString(words: [string, number][]): string {
  const capitalizeFirstLetter =
    (s: string): string => s.length > 0 ? s[0].toUpperCase() + s.substr(1) : s;
  return words.map(([word, count]) => `${capitalizeFirstLetter(word)} (${count})`).join(", ");
}


function SongsSummary(props: {artistName: string; lyricData: LyricData}) {

  function linkToSong(displayText: string, query: string) {
    const baseUrl = "https://www.youtube.com/results?search_query=";
    return <a className="text-dark" target="_blank" rel="noopener noreferrer" 
      href={baseUrl+query}>{displayText}</a>;
  }

  return (
    <>
    <Jumbotron>
      <h2>{props.artistName}</h2>
      <p>{songTotals(props.lyricData)}</p>
      {wordStatistics(props.lyricData).map(e => <p>{e}</p>)}
      <p>{props.lyricData.common.length > 0 ? 
        "Most common words: " + wordTallyToString(props.lyricData.common) + "." : ""}
      </p>
      <p>{props.lyricData.unique.length > 0 ? 
        "Least common words: " + wordTallyToString(props.lyricData.unique) + "." : ""}
      </p>
      {(props.lyricData.positive || props.lyricData.negative) && 
        <h4>Listen to song chosen by lyric sentiment:</h4>}
      {props.lyricData.positive &&
        <Button variant="success">
          {linkToSong("Most Positive", props.artistName + " " + props.lyricData.positive.title)}
        </Button>}
      {props.lyricData.negative &&
        <Button variant="danger">
          {linkToSong("Most Negative", props.artistName + " " + props.lyricData.negative.title)}
        </Button>}
    </Jumbotron>
    </>
  )
}


export default SongsSummary;
