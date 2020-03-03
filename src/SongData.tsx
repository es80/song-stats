import React, { useState, useReducer, useEffect } from 'react';
import Table from 'react-bootstrap/Table';
import Sentiment from 'sentiment';
import { Song, LyricData, SongUpdates } from './types';
import SongsSummary from './SongsSummary';
import SongRow from './SongRow';


// A very simple hash for strings
// from: https://stackoverflow.com/a/34842797
function hashCode(s: string): number {
  return s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0);
}


function wordsFromLyrics(lyrics: string): string[] | null {
  // remove writing credits
  const searchCredits = lyrics.match(/^\([^)]*\)([\s\S]*)/);
  if (searchCredits) {
    lyrics = searchCredits[1];
  }

  // split into words
  const regExpMatchWords = new RegExp(/[^\s\d.,?!+*"()\\/:~#_[\]]+/g);

  return lyrics.match(regExpMatchWords);
}


function wordCountFromWords(words: string[]): Map<string, number> {
  const wordCount: Map<string, number> = new Map();
  
  words.forEach(word => {
    const wordLower = word.toLowerCase();
    const count: number | undefined = wordCount.get(wordLower);
    if (count === undefined) {
      wordCount.set(wordLower, 1);
    } else {
      wordCount.set(wordLower, count + 1);
    }
  });
  
  return wordCount;
}


function resetLyricData(titles: string[] | null): LyricData {
  const initialLyricData: LyricData = {
      songs: new Map(),
      titlesByLyricHashes: new Map(),
      aggregateWordCount: new Map(),
      common: [],
      unique: [],
  };

  if (titles === null) {
    return initialLyricData;
  }

  const newSongsMap: Map<string, Song> = new Map();
  titles.forEach(title => {
    newSongsMap.set(title, {title: title, lyricsState: 'LOADING'}); 
  });

  return {...initialLyricData, songs: newSongsMap};
}


function updateLyricDataWithSong(lyricData: LyricData, song: Song): LyricData {

  if (!song.sentiment || !song.wordCount) {
    return lyricData;
  }

  // track most positive/negative songs
  if (song.sentiment > 0.1) {
    if (!lyricData.positive ||
        (lyricData.positive.sentiment && lyricData.positive.sentiment < song.sentiment)) {
      lyricData.positive = song;
    }
  } else if (song.sentiment < -0.1) {
    if (!lyricData.negative || 
        (lyricData.negative.sentiment && lyricData.negative.sentiment > song.sentiment)) {
      lyricData.negative = song;
    }
  }

  // update aggregate word count
  song.wordCount.forEach((count, word) => {
    const aggCount: number | undefined = lyricData.aggregateWordCount.get(word);
    if (aggCount === undefined) {
      lyricData.aggregateWordCount.set(word, count);
    } else {
      lyricData.aggregateWordCount.set(word, aggCount + count);
    }
  });
 
  // track some unique and commonly used words
  const wordsSortedByCount = Array.from(
    lyricData.aggregateWordCount.entries()).sort((a, b) => b[1] - a[1]);

  let uniqueLength = 10;
  let commonLength = 10;
  if (wordsSortedByCount.length < uniqueLength + commonLength) {
    uniqueLength = Math.floor(wordsSortedByCount.length / 2);
    commonLength = wordsSortedByCount.length - uniqueLength;
  }

  let uniqueWords = wordsSortedByCount.filter(e => e[1] === 1);
  if (uniqueWords.length < uniqueLength) {
    uniqueWords = wordsSortedByCount.slice(-uniqueLength);
   } else {
     // shuffle the words
     const n = uniqueWords.length;
     for (let i = 0; i < n - 1; i++) {
       const j = Math.floor(Math.random() * (n - i) + i);
       const temp = uniqueWords[i];
       uniqueWords[i] = uniqueWords[j];
       uniqueWords[j] = temp;
     }
     uniqueWords = uniqueWords.slice(0, uniqueLength);
   }

  lyricData.unique = uniqueWords;
  lyricData.common = wordsSortedByCount.slice(0, commonLength);
  
  return lyricData;
}


function reducerLyricData(prevLyricData: LyricData, action: SongUpdates): LyricData {

  switch (action.type) {
    case "LOADING":
      return resetLyricData(action.payload);
    case "FOUND_NONE":
    case "FAILED":
      return {...prevLyricData, 
        songs: prevLyricData.songs.set(action.payload.title, {
          title: action.payload.title, 
          lyricsState: action.type
        })
      };
    case "FOUND_LYRICS":
      break;
  }

  const lyrics: string = action.payload.lyrics;
  const title: string = action.payload.title;
  
  // check if instrumental
  if (lyrics === "Instrumental") {
    return {...prevLyricData,
      songs: prevLyricData.songs.set(title, {
        title: title, 
        lyricsState: "FOUND_LYRICS", 
        instrumental: true
      })
    };
  }

  // get words
  const words: string[] | null = wordsFromLyrics(lyrics);

  // check for no matches
  if (words === null || words.length === 0) {
    return {...prevLyricData,
      songs: prevLyricData.songs.set(title, {
        title: title, 
        lyricsState: "FOUND_NONE"
      })
    };
  }

  // get a hash from the lyrics
  const lyricHash: number = hashCode(lyrics);

  if (!prevLyricData.titlesByLyricHashes) {
    prevLyricData.titlesByLyricHashes = new Map();
  }
  
  if (prevLyricData.titlesByLyricHashes.has(lyricHash)) {
    // already seen these lyrics, keep the song with shortest title 
    const oldTitle: string = prevLyricData.titlesByLyricHashes.get(lyricHash) as string;
    const oldSong: Song = prevLyricData.songs.get(oldTitle) as Song;
    
    const newSongMap: Map<string, Song> = new Map(prevLyricData.songs);
    
    if (oldTitle.length < title.length) {
      newSongMap.delete(title);
      return {...prevLyricData, songs: newSongMap};
    }

    newSongMap.delete(oldTitle);
    return {...prevLyricData,
      songs: newSongMap.set(title, {...oldSong, title: title}),
      titlesByLyricHashes: prevLyricData.titlesByLyricHashes.set(lyricHash, title)
    };
  }

  // create updated song 
  const updatedSong: Song = {
    title: title,
    lyricsState: "FOUND_LYRICS",
    lyricHash: lyricHash,
    wordCount: wordCountFromWords(words),
    sentiment: new Sentiment().analyze(lyrics).comparative,
  }
  
  // update aggregate data
  return {...updateLyricDataWithSong(prevLyricData, updatedSong),
    songs: prevLyricData.songs.set(title, updatedSong),
    titlesByLyricHashes: prevLyricData.titlesByLyricHashes.set(lyricHash, title)
  };
}


function SongData(props: {artistName: string; titles: string[]}) {

  const [lyricData, setLyricData] = useReducer(reducerLyricData, null, resetLyricData);
  const [childPropsReady, setChildPropsReady] = useState(false);

  useEffect(() => {
    setLyricData({type: "LOADING", payload: props.titles});
    setChildPropsReady(true);
    props.titles.forEach(title => {
      const titleQuery: string = encodeURIComponent(title);
      fetch(`https://api.lyrics.ovh/v1/${props.artistName}/${titleQuery}`)
        .then(response => response.json())
        .then(data => {
          if(data.lyrics) {
            setLyricData({type: "FOUND_LYRICS", payload: {title: title, lyrics: data.lyrics}});
          } else {
            setLyricData({type: "FOUND_NONE", payload: {title: title}});
          }
        })
        .catch(err => {
          setLyricData({type: "FAILED", payload: {title: title}});
        })
    });
  }, [props.titles]);

  function compareSongs(a: Song, b: Song): number {
    if (a.lyricsState === b.lyricsState) {
      if (a.instrumental) {
        return 1;
      }
    } else if (a.lyricsState === "FOUND_NONE") {
      return 1;
    }
    return 0;
  }

  if (!childPropsReady) {
    return null;
  }
  return (
    <>
      <SongsSummary artistName={props.artistName} lyricData={lyricData}/>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Song Title</th>
            <th>Total Words</th>
            <th>Unique Words</th>
            <th colSpan={3}>Most Common Words</th>
            <th>Sentiment</th>
          </tr>
        </thead>
          <tbody>
            {Array.from(lyricData.songs.entries())
              .sort((a,b) => compareSongs(a[1],b[1]))
              .map(([title, song]) => <SongRow key={title} title={title} song={song} />)}
          </tbody>
      </Table>
    </>
  )
}

export default SongData;
