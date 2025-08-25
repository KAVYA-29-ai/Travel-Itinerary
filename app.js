// Indian Market Price Predictor - Frontend JavaScript
class PricePredictor {
    constructor() {
        this.form = document.getElementById('prediction-form');
        this.predictBtn = document.getElementById('predict-btn');
        this.loadingSection = document.getElementById('loading-section');
        this.resultsSection = document.getElementById('results-section');
        this.errorSection = document.getElementById('error-section');
        this.loadingSteps = document.getElementById('loading-steps');

        this.loadingMessages = [
            'Extracting specifications...',
            'Analyzing market data...',
            'Consulting AI models...',
            'Calculating price ranges...',
            'Finalizing predictions...'
        ];

        this.init();
    }

    init() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        document.getElementById('retry-btn').addEventListener('click', this.hideError.bind(this));
        this.addStarBackground();
    }

    addStarBackground() {
        const starsContainer = document.querySelector('.stars');
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: #fff;
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation: sparkle ${2 + Math.random() * 3}s linear infinite;
                animation-delay: ${Math.random() * 3}s;
                opacity: ${0.3 + Math.random() * 0.7};
            `;
            starsContainer.appendChild(star);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const productSpecs = document.getElementById('product-specs').value.trim();
        if (!productSpecs) return;

        this.showLoading();
        this.hideError();
        this.hideResults();

        try {
            const result = await this.predictPrice(productSpecs);
            this.showResults(result);
        } catch (error) {
            console.error('Prediction error:', error);
            this.showError(error.message || 'Failed to predict price. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async predictPrice(specs) {
        this.simulateLoadingSteps();

        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ specs })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        return data;
    }

    simulateLoadingSteps() {
        let step = 0;
        const interval = setInterval(() => {
            if (step < this.loadingMessages.length) {
                this.loadingSteps.textContent = this.loadingMessages[step];
                step++;
            } else {
                clearInterval(interval);
            }
        }, 800);

        this.loadingInterval = interval;
    }

    showLoading() {
        this.predictBtn.disabled = true;
        this.predictBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Predicting...</span>';
        this.loadingSection.classList.remove('hidden');
        this.loadingSection.classList.add('fade-in');
    }

    hideLoading() {
        this.predictBtn.disabled = false;
        this.predictBtn.innerHTML = '<i class="fas fa-magic"></i> <span>Predict Price</span>';
        this.loadingSection.classList.add('hidden');
        if (this.loadingInterval) clearInterval(this.loadingInterval);
    }

    showResults(data) {
        document.getElementById('predicted-price').textContent = `₹${this.formatPrice(data.predicted_price_inr)}`;
        document.getElementById('price-range').textContent =
            `Range: ₹${this.formatPrice(data.range_inr.min)} - ₹${this.formatPrice(data.range_inr.max)}`;

        const confidence = Math.round(data.confidence * 100);
        document.getElementById('confidence-fill').style.width = `${confidence}%`;
        document.getElementById('confidence-percent').textContent = `${confidence}%`;

        document.getElementById('product-name').textContent = data.product || 'Unknown Product';
        document.getElementById('product-category').textContent = data.category || 'Unknown';
        document.getElementById('model-used').textContent = data.used_backup_model ? 'Backup Model + Gemini AI' : 'Gemini AI';

        this.displaySpecs(data.specs_extracted || {});
        this.displayExplanation(data.explanation_bullets || []);
        this.displayAnomalies(data.anomalies || []);

        this.resultsSection.classList.remove('hidden');
        this.resultsSection.classList.add('fade-in');
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    displaySpecs(specs) {
        const specsContainer = document.getElementById('specs-display');
        specsContainer.innerHTML = '';

        if (Object.keys(specs).length === 0) {
            specsContainer.innerHTML = '<p class="no-specs">No specifications extracted</p>';
            return;
        }

        Object.entries(specs).forEach(([key, value]) => {
            const specItem = document.createElement('div');
            specItem.className = 'spec-item';
            specItem.innerHTML = `
                <div class="spec-key">${this.formatSpecKey(key)}</div>
                <div class="spec-value">${value}</div>
            `;
            specsContainer.appendChild(specItem);
        });
    }

    displayExplanation(bullets) {
        const explanationList = document.getElementById('explanation-list');
        explanationList.innerHTML = '';

        if (bullets.length === 0) {
            explanationList.innerHTML = '<li>No explanation available</li>';
            return;
        }

        bullets.forEach(bullet => {
            const li = document.createElement('li');
            li.textContent = bullet;
            explanationList.appendChild(li);
        });
    }

    displayAnomalies(anomalies) {
        const anomaliesSection = document.getElementById('anomalies-section');
        const anomaliesList = document.getElementById('anomalies-list');

        if (anomalies.length === 0) {
            anomaliesSection.classList.add('hidden');
            return;
        }

        anomaliesSection.classList.remove('hidden');
        anomaliesList.innerHTML = '';

        anomalies.forEach(anomaly => {
            const anomalyItem = document.createElement('div');
            anomalyItem.className = 'anomaly-item';
            anomalyItem.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>${anomaly}</span>
            `;
            anomaliesList.appendChild(anomalyItem);
        });
    }

    formatSpecKey(key) {
        return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    formatPrice(price) {
        if (price >= 10000000) return `${(price / 10000000).toFixed(1)}Cr`;
        if (price >= 100000) return `${(price / 100000).toFixed(1)}L`;
        if (price >= 1000) return `${(price / 1000).toFixed(1)}K`;
        return price.toLocaleString('en-IN');
    }

    showError(message) {
        document.getElementById('error-message').textContent = message;
        this.errorSection.classList.remove('hidden');
        this.errorSection.classList.add('fade-in');
        this.errorSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    hideError() {
        this.errorSection.classList.add('hidden');
    }

    hideResults() {
        this.resultsSection.classList.add('hidden');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new PricePredictor();
});

// Cosmic cursor
document.addEventListener('mousemove', (e) => {
    let cursor = document.querySelector('.cosmic-cursor');
    if (!cursor) {
        cursor = document.createElement('div');
        cursor.className = 'cosmic-cursor';
        cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, rgba(99,102,241,0.8), transparent);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transition: transform 0.1s ease;
        `;
        document.body.appendChild(cursor);
    }
    cursor.style.left = e.clientX - 10 + 'px';
    cursor.style.top = e.clientY - 10 + 'px';
});

// Scroll animations
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('fade-in');
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.glass-card').forEach(card => observer.observe(card));
});
