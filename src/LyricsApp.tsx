import React, { useState, useEffect } from 'react';
import SongData from './SongData';
import 'bootstrap/dist/css/bootstrap.min.css';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';


function LyricsApp() {

  const baseUrl = "https://musicbrainz.org/ws/2"
  const [url, setUrl] = useState("");
  const [query, setQuery] = useState("");
  const [mbArtistId, setMbArtistId] = useState("");
  const [artistName, setArtistName] = useState("");
  const [titles, setTitles] = useState<string []>([]);
  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(false);

  useEffect(() => {
    if (url === "") {
      return;
    }
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.artists[0].name && data.artists[0].id) {
          setArtistName(data.artists[0].name);
          setMbArtistId(data.artists[0].id);
        } else {
          setError(true);
        }
      })
      .catch(err => {
        setError(true);
      });
      setLoading(false);
  }, [url]);

  useEffect(() => {
    if (mbArtistId === "") {
      return;
    }
    fetch(`${baseUrl}/recording/?query=arid:${mbArtistId}&limit=100&fmt=json`)
      .then(response => response.json())
      .then(data => {
        const recordingsArray: string[] = data.recordings.map((obj: any) => obj.title);
        setTitles(Array.from(new Set(recordingsArray).keys()));
        setError(false);
      })
      .catch(err => {
        setError(true);
      });
      setLoading(false);
  }, [mbArtistId]);

  function resetState(): void {
    setUrl("");
    setQuery("");
    setMbArtistId("");
    setArtistName("");
    setTitles([]);
    setError(false);
  }

  function renderData() {
    if (isLoading) {
      return (
        <Spinner animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
      )
    }
    if (isError) {
      return <Alert variant="danger">Unable to find data for that artist.</Alert>;
    }
    if (artistName) {
      return <SongData artistName={artistName} titles={titles}/>;
    }
  }

  return (
    <>
      <Form onSubmit={(event: any): void => {
        setUrl(`${baseUrl}/artist/?query=${query}&limit=10&fmt=json`)
        setQuery("");
        event.preventDefault();
        }}>
      <Form.Group>
        <Form.Control
          size="lg"
          type="text"
          placeholder="Artist name..."
          value={query}
          onChange={(event: any): void => setQuery(event.target.value)}
        />
        <Button variant="primary" type="submit">Search</Button>
        <Button variant="secondary" onClick={resetState}>Clear</Button>
      </Form.Group>
    </Form>
    {renderData()}
  </>
  );
}

export default LyricsApp;
