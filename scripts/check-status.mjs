import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAX_HISTORY = 60; // in days

const loadConfig = () => {
  try {
    const configPath = resolve(__dirname, '../config.json');
    return JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error('Error loading config:', error.message);
    process.exit(1);
  }
};

const checkService = (url) => {
    try {
      const response = execSync(
        `curl -I -s -L "${url.replace(/^https?:\/\//, '')}" -o /dev/null -w "%{http_code}\n%{time_total}"`,
        { timeout: 15000 }
      ).toString().split('\n');
  
      return {
        status: response[0].startsWith('2') || response[0].startsWith('3') ? 'up' : 'down',
        responseTime: Math.round(parseFloat(response[1]) * 1000),
        error: null
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: null,
        error: error.message.includes('timeout') ? 'Timeout' : 'Connection failed'
      };
    }
  };

const updateStatus = () => {
    const config = loadConfig();
    const historyPath = resolve(__dirname, '../public/status.json');
    
    let history = { services: [] };
    try {
      history = JSON.parse(readFileSync(historyPath, 'utf8'));
    } catch (error) {
      console.log('No existing status file, creating new one');
    }

config.services.forEach(serviceConfig => {
    const existingService = history.services.find(s => s.url === serviceConfig.url);
    const checkResult = checkService(serviceConfig.url);
    
    const newEntry = {
        timestamp: new Date().toISOString(),
        ...checkResult
    };

    if (existingService) {
        existingService.history = [...existingService.history, newEntry].slice(-MAX_HISTORY);
    } else {
        history.services.push({
            name: serviceConfig.name,
            url: serviceConfig.url,
            history: [newEntry]
        });
    }
});
  
    history.lastUpdated = new Date().toISOString();
    try {
      mkdirSync(resolve(__dirname, '../public'), { recursive: true });
      writeFileSync(historyPath, JSON.stringify(history, null, 2));
      console.log('Status updated successfully');
    } catch (error) {
      console.error('Error writing status file:', error.message);
      process.exit(1);
    }
  };

updateStatus();