(function() {
    'use strict';
    
    // Ensure showAlert function is available
    if (!window.showAlert) {
        window.showAlert = function(message, type = 'success') {
            console.log(`${type.toUpperCase()}: ${message}`);
            createUtilityAlert(message, type);
        };
    }

    // Ensure showLoading function is available
    if (!window.showLoading) {
        window.showLoading = function(message = 'Loading...') {
            console.log('Loading:', message);
            createUtilityAlert(message, 'info');
        };
    }

    // Ensure showError function is available
    if (!window.showError) {
        window.showError = function(message) {
            console.error('Error:', message);
            createUtilityAlert(message, 'danger');
        };
    }

    function createUtilityAlert(message, type) {
        let alertContainer = document.getElementById('alert-container');
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.id = 'alert-container';
            alertContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 400px;';
            document.body.appendChild(alertContainer);
        }
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.style.cssText = 'margin-bottom: 10px; padding: 10px; border-radius: 4px; position: relative; border: 1px solid transparent;';
        
        // Set colors based on Bootstrap styles
        const styles = {
            success: { bg: '#d4edda', border: '#c3e6cb', color: '#155724' },
            warning: { bg: '#fff3cd', border: '#ffeaa7', color: '#856404' },
            danger: { bg: '#f8d7da', border: '#f5c6cb', color: '#721c24' },
            info: { bg: '#d1ecf1', border: '#bee5eb', color: '#0c5460' }
        };
        
        const style = styles[type] || styles.info;
        alert.style.backgroundColor = style.bg;
        alert.style.borderColor = style.border;
        alert.style.color = style.color;
        
        alert.innerHTML = `
            <button type="button" class="close" onclick="this.parentElement.remove()" style="position: absolute; top: 5px; right: 10px; background: none; border: none; font-size: 18px; cursor: pointer; color: ${style.color};">
                <span>&times;</span>
            </button>
            <div style="margin-right: 30px;">
                ${type === 'info' ? '<i class="fa fa-info-circle"></i>' : ''}
                ${type === 'success' ? '<i class="fa fa-check-circle"></i>' : ''}
                ${type === 'warning' ? '<i class="fa fa-exclamation-triangle"></i>' : ''}
                ${type === 'danger' ? '<i class="fa fa-times-circle"></i>' : ''}
                ${message}
            </div>
        `;
        
        alertContainer.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }

    console.log('Medication utilities loaded successfully');
})();
