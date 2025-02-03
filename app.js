async function initDashboard() {
    const response = await fetch('/public/status.json');
    const data = await response.json();
    
    const container = document.getElementById('services-container');
    const template = document.getElementById('service-card-template');
    
    document.getElementById('last-checked').textContent = relativeTime(new Date(data.lastUpdated));

    data.services.forEach(service => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.service-card');
        
        // Service name and latest status
        card.querySelector('.service-name').textContent = service.name;
        const latest = service.history[service.history.length - 1];
        const indicator = card.querySelector('.status-indicator');
        indicator.classList.add(latest.status === 'up' ? 'up' : 'down');
        
        // Latest status details
        card.querySelector('.current-status').textContent = 
            latest.status.toUpperCase();
        card.querySelector('.response-time').textContent = 
            latest.responseTime ? `${latest.responseTime}ms` : '';
        
            const timeline = card.querySelector('.history-timeline');
            timeline.innerHTML = '';
            
            const now = new Date();
            const days = Array.from({ length: 60 }, (_, i) => {
                const day = new Date(now);
                day.setDate(day.getDate() - (59 - i)); // Most recent first
                day.setHours(0, 0, 0, 0);
                return day;
            });
            
            const checkMap = new Map();
            service.history.forEach(check => {
                const checkDay = new Date(check.timestamp);
                checkDay.setHours(0, 0, 0, 0);
                checkMap.set(checkDay.getTime(), check);
            });
            
            days.forEach(day => {
                const check = checkMap.get(day.getTime());
                const bar = document.createElement('div');
                bar.className = `history-bar ${check ? check.status : 'empty'}`;
                
                bar.title = `${formatDate(day)} - ${check ? check.status : 'no data'}`;
                timeline.appendChild(bar);
            });
        
        container.appendChild(clone);
    });
}

function relativeTime(date) {
    const units = [
        { name: 'minute', limit: 3600, in_seconds: 60 },
        { name: 'hour', limit: 86400, in_seconds: 3600 },
        { name: 'day', limit: Infinity, in_seconds: 86400 }
    ];

    const diff = (Date.now() - date.getTime()) / 1000;
    const unit = units.find(u => diff < u.limit);
    const value = Math.floor(diff / unit.in_seconds);
    return `${value} ${unit.name}${value !== 1 ? 's' : ''} ago`;
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IE', {
        month: 'short',
        day: 'numeric'
    });
}

document.addEventListener('DOMContentLoaded', initDashboard);