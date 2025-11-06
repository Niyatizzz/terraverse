/**
 * Analytics UI - Displays interaction analysis and actor dynamics
 */
export class AnalyticsUI {
  constructor(actorManager) {
    this.actorManager = actorManager;
    this.visible = false;
    this.createUI();
    this.setupEventListeners();
  }
  
  createUI() {
    // Create main analytics panel
    const panel = document.createElement('div');
    panel.id = 'analytics-panel';
    panel.style.cssText = `
      position: fixed;
      top: 60px;
      right: 20px;
      width: 400px;
      max-height: 80vh;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      overflow-y: auto;
      display: none;
      z-index: 1000;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    `;
    
    panel.innerHTML = `
      <h2 style="margin: 0 0 15px 0; color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
        📊 ACTOR DYNAMICS ANALYSIS
      </h2>
      
      <div id="analytics-summary" style="margin-bottom: 20px;"></div>
      
      <h3 style="color: #2196F3; margin: 15px 0 10px 0;">🎭 Actor Distribution</h3>
      <div id="actor-types" style="margin-bottom: 20px;"></div>
      
      <h3 style="color: #FF9800; margin: 15px 0 10px 0;">🔄 Current Behaviors</h3>
      <div id="behavior-dist" style="margin-bottom: 20px;"></div>
      
      <h3 style="color: #9C27B0; margin: 15px 0 10px 0;">🤝 Interaction Matrix</h3>
      <div id="interaction-matrix" style="margin-bottom: 20px;"></div>
      
      <h3 style="color: #F44336; margin: 15px 0 10px 0;">📜 Recent Interactions</h3>
      <div id="recent-interactions" style="margin-bottom: 20px; max-height: 200px; overflow-y: auto;"></div>
      
      <h3 style="color: #00BCD4; margin: 15px 0 10px 0;">👥 Actor Details</h3>
      <div id="actor-details" style="max-height: 300px; overflow-y: auto;"></div>
    `;
    
    document.body.appendChild(panel);
    this.panel = panel;
    
    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'analytics-toggle';
    toggleBtn.textContent = '📊';
    toggleBtn.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: rgba(76, 175, 80, 0.9);
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 24px;
      cursor: pointer;
      z-index: 1001;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      transition: all 0.3s;
    `;
    toggleBtn.onmouseover = () => {
      toggleBtn.style.transform = 'scale(1.1)';
      toggleBtn.style.background = 'rgba(76, 175, 80, 1)';
    };
    toggleBtn.onmouseout = () => {
      toggleBtn.style.transform = 'scale(1)';
      toggleBtn.style.background = 'rgba(76, 175, 80, 0.9)';
    };
    
    document.body.appendChild(toggleBtn);
    this.toggleBtn = toggleBtn;
  }
  
  setupEventListeners() {
    this.toggleBtn.addEventListener('click', () => {
      this.toggle();
    });
    
    // Update analytics every second
    setInterval(() => {
      if (this.visible) {
        this.update();
      }
    }, 1000);
  }
  
  toggle() {
    this.visible = !this.visible;
    this.panel.style.display = this.visible ? 'block' : 'none';
    if (this.visible) {
      this.update();
    }
  }
  
  update() {
    const analytics = this.actorManager.getAnalytics();
    
    // Update summary
    document.getElementById('analytics-summary').innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div style="background: rgba(76, 175, 80, 0.2); padding: 10px; border-radius: 5px;">
          <div style="font-size: 24px; font-weight: bold;">${analytics.actorCount}</div>
          <div style="color: #aaa;">Total Actors</div>
        </div>
        <div style="background: rgba(33, 150, 243, 0.2); padding: 10px; border-radius: 5px;">
          <div style="font-size: 24px; font-weight: bold;">${analytics.totalInteractions}</div>
          <div style="color: #aaa;">Interactions</div>
        </div>
        <div style="background: rgba(255, 152, 0, 0.2); padding: 10px; border-radius: 5px;">
          <div style="font-size: 24px; font-weight: bold;">${analytics.totalDistance}</div>
          <div style="color: #aaa;">Total Distance</div>
        </div>
        <div style="background: rgba(156, 39, 176, 0.2); padding: 10px; border-radius: 5px;">
          <div style="font-size: 24px; font-weight: bold;">${analytics.totalBlocksInteracted}</div>
          <div style="color: #aaa;">Block Interactions</div>
        </div>
      </div>
    `;
    
    // Update actor types
    this.updateBarChart('actor-types', analytics.actorTypeCount, {
      'wanderer': '#4CAF50',
      'collector': '#2196F3',
      'builder': '#FF9800',
      'follower': '#9C27B0',
      'cat': '#FF69B4',
      'dog': '#8B4513'
    });
    
    // Update behavior distribution
    this.updateBarChart('behavior-dist', analytics.behaviorDistribution, null);
    
    // Update interaction matrix
    const matrix = this.actorManager.getInteractionMatrix();
    let matrixHTML = '<div style="font-size: 11px;">';
    for (const [key, count] of Object.entries(matrix)) {
      const barWidth = Math.min(100, (count / Math.max(...Object.values(matrix))) * 100);
      matrixHTML += `
        <div style="margin: 5px 0;">
          <div style="color: #aaa;">${key}</div>
          <div style="display: flex; align-items: center;">
            <div style="width: ${barWidth}%; height: 20px; background: linear-gradient(90deg, #4CAF50, #2196F3); border-radius: 3px;"></div>
            <span style="margin-left: 10px;">${count}</span>
          </div>
        </div>
      `;
    }
    matrixHTML += '</div>';
    document.getElementById('interaction-matrix').innerHTML = matrixHTML || '<div style="color: #666;">No interactions yet</div>';
    
    // Update recent interactions
    let interactionsHTML = '';
    for (const interaction of analytics.recentInteractions.slice().reverse()) {
      const time = new Date(interaction.timestamp).toLocaleTimeString();
      interactionsHTML += `
        <div style="background: rgba(255, 255, 255, 0.05); padding: 8px; margin: 5px 0; border-radius: 5px; border-left: 3px solid #4CAF50;">
          <div style="color: #4CAF50;">${time}</div>
          <div>${interaction.actor1.type} ⟷ ${interaction.actor2.type}</div>
          <div style="color: #666; font-size: 10px;">${interaction.type}</div>
        </div>
      `;
    }
    document.getElementById('recent-interactions').innerHTML = interactionsHTML || '<div style="color: #666;">No interactions yet</div>';
    
    // Update actor details
    let actorHTML = '';
    for (const actor of analytics.actorStats) {
      const colors = {
        'wanderer': '#4CAF50',
        'collector': '#2196F3',
        'builder': '#FF9800',
        'follower': '#9C27B0',
        'cat': '#FF69B4',
        'dog': '#8B4513'
      };
      const color = colors[actor.type] || '#fff';
      
      // Add emoji for animals
      const emoji = actor.type === 'cat' ? '🐱 ' : actor.type === 'dog' ? '🐶 ' : '';
      
      actorHTML += `
        <div style="background: rgba(255, 255, 255, 0.05); padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 3px solid ${color};">
          <div style="font-weight: bold; color: ${color}; font-size: 14px;">${emoji}${actor.name}</div>
          <div style="font-size: 10px; color: #aaa; text-transform: uppercase; margin-bottom: 5px;">${actor.type}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 11px;">
            <div>Behavior: <span style="color: ${color}">${actor.behavior}</span></div>
            <div>Energy: ${actor.energy}%</div>
            <div>Distance: ${actor.totalDistance}</div>
            <div>Nearby: ${actor.nearbyActors}</div>
          </div>
          ${actor.inventory !== undefined ? `<div style="margin-top: 5px; font-size: 11px;">Inventory: ${actor.inventory}/10</div>` : ''}
          ${actor.blocksPlaced !== undefined ? `<div style="margin-top: 5px; font-size: 11px;">Built: ${actor.blocksPlaced} blocks</div>` : ''}
        </div>
      `;
    }
    document.getElementById('actor-details').innerHTML = actorHTML;
  }
  
  updateBarChart(elementId, data, colors) {
    if (Object.keys(data).length === 0) {
      document.getElementById(elementId).innerHTML = '<div style="color: #666;">No data</div>';
      return;
    }
    
    const maxValue = Math.max(...Object.values(data));
    let html = '<div style="font-size: 11px;">';
    
    for (const [key, value] of Object.entries(data)) {
      const barWidth = (value / maxValue) * 100;
      const color = colors ? colors[key] || '#4CAF50' : '#4CAF50';
      
      html += `
        <div style="margin: 5px 0;">
          <div style="color: #aaa; text-transform: capitalize;">${key}</div>
          <div style="display: flex; align-items: center;">
            <div style="width: ${barWidth}%; height: 20px; background: ${color}; border-radius: 3px;"></div>
            <span style="margin-left: 10px;">${value}</span>
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    document.getElementById(elementId).innerHTML = html;
  }
}