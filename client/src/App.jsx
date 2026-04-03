import React, { useState, useEffect } from 'react';

function App() {
  const [mosqueId, setMosqueId] = useState('attaqwa-etten-leur');
  const [baseUrl, setBaseUrl] = useState('');
  const [eventName, setEventName] = useState('Reading');
  const [startPrayer, setStartPrayer] = useState('Maghrib');
  const [endPrayer, setEndPrayer] = useState('Isha');

  const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const cleanId = mosqueId.trim().replace(/^\/+|\/+$/g, '');
  const prayersUrl = cleanId ? `${baseUrl}/ics/${cleanId}/prayers` : '';
  const sleepUrl = cleanId ? `${baseUrl}/ics/${cleanId}/sleep` : '';
  const betweenUrl = cleanId 
    ? `${baseUrl}/ics/${cleanId}/between?start=${startPrayer}&end=${endPrayer}&name=${encodeURIComponent(eventName)}`
    : '';

  const styles = {
    body: { padding: '40px', maxWidth: '800px', margin: '0 auto' },
    container: { background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    h1: { color: '#2c3e50', marginTop: 0 },
    inputGroup: { marginBottom: '25px' },
    label: { display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#34495e' },
    input: { width: '100%', padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' },
    links: { marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' },
    linkCard: { background: '#f8f9fa', borderLeft: '4px solid #3498db', padding: '15px', marginBottom: '15px', borderRadius: '4px' },
    linkCardTitle: { margin: '0 0 10px 0', fontSize: '1.1em', color: '#2c3e50' },
    urlBox: { background: '#fff', border: '1px solid #e1e4e8', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.9em', marginBottom: '10px' },
    link: { color: '#3498db', textDecoration: 'none', fontWeight: 'bold' },
    hint: { fontSize: '0.85em', color: '#7f8c8d', marginTop: '5px' }
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <h1 style={styles.h1}>ICS Feed Generator</h1>
        <p>Enter your Mosque ID from Mawaqit to get your personalized ICS feed links.</p>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Mosque ID:</label>
          <input 
            type="text" 
            style={styles.input}
            placeholder="e.g. vlaardingen/noer-islam or attaqwa-etten-leur" 
            value={mosqueId}
            onChange={(e) => setMosqueId(e.target.value)}
          />
          <p style={styles.hint}>Found in the Mawaqit URL: mawaqit.net/en/<strong>mosque-id</strong></p>
        </div>

        <div style={{...styles.inputGroup, display: 'flex', gap: '15px'}}>
          <div style={{flex: 1}}>
            <label style={styles.label}>Event Name:</label>
            <input 
              type="text" 
              style={styles.input}
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
          </div>
          <div style={{flex: 1}}>
            <label style={styles.label}>Start Prayer:</label>
            <select 
              style={styles.input}
              value={startPrayer}
              onChange={(e) => setStartPrayer(e.target.value)}
            >
              {prayers.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={{flex: 1}}>
            <label style={styles.label}>End Prayer:</label>
            <select 
              style={styles.input}
              value={endPrayer}
              onChange={(e) => setEndPrayer(e.target.value)}
            >
              {prayers.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div style={styles.links}>
          <div style={styles.linkCard}>
            <h3 style={styles.linkCardTitle}>Prayers ICS Feed</h3>
            <div style={styles.urlBox}>{prayersUrl || 'Please enter a Mosque ID'}</div>
            {prayersUrl && <a href={prayersUrl} target="_blank" style={styles.link}>Open Feed</a>}
          </div>
          
          <div style={{...styles.linkCard, borderLeftColor: '#2ecc71'}}>
            <h3 style={styles.linkCardTitle}>Sleep ICS Feed</h3>
            <div style={styles.urlBox}>{sleepUrl || 'Please enter a Mosque ID'}</div>
            {sleepUrl && <a href={sleepUrl} target="_blank" style={styles.link}>Open Feed</a>}
          </div>

          <div style={{...styles.linkCard, borderLeftColor: '#f1c40f'}}>
            <h3 style={styles.linkCardTitle}>Custom "Between Prayers" Feed</h3>
            <div style={styles.urlBox}>{betweenUrl || 'Please enter a Mosque ID'}</div>
            {betweenUrl && <a href={betweenUrl} target="_blank" style={styles.link}>Open Feed</a>}
            <p style={styles.hint}>Generates events named "{eventName}" between {startPrayer} and {endPrayer}.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
