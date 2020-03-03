import React from 'react';
import Spinner from 'react-bootstrap/Spinner';
import { Song } from './types';

function SongRow(props: {song: Song; title: string}) {

  function displayFoundLyrics(song: Song) {
    if (song.wordCount) {
      const totalWordCount = Array.from(song.wordCount.values()).reduce((a, b) => a + b, 0);
      const uniqueWordCount = song.wordCount.size;

      const wordsSortedByCount = Array.from(song.wordCount.entries()).sort((a, b) => b[1] - a[1]);
      while (wordsSortedByCount.length < 3) {
        wordsSortedByCount.push(["", 0]);
      }

      const sentiment: string = song.sentiment === undefined ? "" :
        song.sentiment.toFixed(2).toString();

      const capitalizeFirstLetter =
        (s: string): string => s.length > 0 ? s[0].toUpperCase() + s.substr(1) : s;
      
      return (
        <>
          <td>{totalWordCount}</td>
          <td>{uniqueWordCount}</td>
          <td>{capitalizeFirstLetter(wordsSortedByCount[0][0])}</td>
          <td>{capitalizeFirstLetter(wordsSortedByCount[1][0])}</td>
          <td>{capitalizeFirstLetter(wordsSortedByCount[2][0])}</td>
          <td>{sentiment}</td>
        </>
      );
    }
  }

  function displayLyricsCells(song: Song) {
    switch (song.lyricsState) {
      case "LOADING":
        return <td colSpan={6}><Spinner animation="border" size="sm" />  Searching...</td>;
      case "FOUND_NONE":
      case "FAILED":
        return <td colSpan={6}>No Lyrics Found</td>;
      case "FOUND_LYRICS":
        if (song.instrumental) {
          return <td colSpan={6}>Instrumental Song</td>;
        } else {
          return displayFoundLyrics(song);
        }
    }
  }

  return (
    <tr >
      <td>{props.title}</td>
      {displayLyricsCells(props.song)}
    </tr>
  )
}

export default SongRow;
