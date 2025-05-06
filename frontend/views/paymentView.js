import { getCurrentUser } from '../controllers/authController.js';

export function renderPayments(payments) {
  const container = document.getElementById("payment-list");
  if (!container) return;
  
  container.innerHTML = "";
  const currentUser = getCurrentUser();
  const isAdmin = currentUser && currentUser.role === 'admin';
  
  if (payments.length === 0) {
    container.innerHTML = "<p>Aucun paiement trouvé.</p>";
    return;
  }
  
  const filterSection = document.createElement("div");
  filterSection.className = "filter-section";
  filterSection.innerHTML = `
    <h3>Filtrer les paiements</h3>
    <div class="filter-controls">
      <select id="filter-method">
        <option value="">Tous les moyens de paiement</option>
        <option value="cb">Carte bancaire</option>
        <option value="paypal">PayPal</option>
      </select>
      <select id="filter-status">
        <option value="">Tous les statuts</option>
        <option value="en_attente">En attente</option>
        <option value="effectue">Effectué</option>
        <option value="echoue">Échoué</option>
      </select>
      <button id="apply-filter" class="btn-secondary">Appliquer</button>
      <button id="reset-filter" class="btn-secondary">Réinitialiser</button>
    </div>
  `;
  container.appendChild(filterSection);
  
  const filterMethodSelect = document.getElementById('filter-method');
  const filterStatusSelect = document.getElementById('filter-status');
  const applyFilterBtn = document.getElementById('apply-filter');
  const resetFilterBtn = document.getElementById('reset-filter');
  
  if (applyFilterBtn && resetFilterBtn) {
    applyFilterBtn.addEventListener('click', () => {
      const methodFilter = filterMethodSelect.value;
      const statusFilter = filterStatusSelect.value;
      
      const filteredPayments = payments.filter(payment => {
        if (methodFilter && payment.method !== methodFilter) return false;
        if (statusFilter && payment.status !== statusFilter) return false;
        return true;
      });
      
      renderPaymentsList(filteredPayments, container);
    });
    
    resetFilterBtn.addEventListener('click', () => {
      filterMethodSelect.value = '';
      filterStatusSelect.value = '';
      renderPaymentsList(payments, container);
    });
  }
  
  renderPaymentsList(payments, container);
}

function renderPaymentsList(payments, container) {
  const paymentListContainer = document.createElement("div");
  paymentListContainer.className = "payments-container";
  
  payments.forEach(payment => {
    const div = document.createElement("div");
    div.className = `payment-card ${payment.getStatusClass()}`;
    
    div.innerHTML = `
      <h3>Paiement #${payment.id}</h3>
      <p>Réservation: #${payment.reservation_id}</p>
      <p>Montant: ${payment.getFormattedAmount()}</p>
      <p>Méthode: ${payment.getMethodLabel()}</p>
      <p>Statut: <span class="${payment.getStatusClass()}">${payment.getStatusLabel()}</span></p>
      <p>Date: ${payment.getFormattedDate()}</p>
      <div class="payment-actions">
        ${renderPaymentActions(payment)}
      </div>
    `;
    
    paymentListContainer.appendChild(div);
  });
  
  const existingList = container.querySelector('.payments-container');
  if (existingList) {
    container.replaceChild(paymentListContainer, existingList);
  } else {
    container.appendChild(paymentListContainer);
  }
}

function renderPaymentActions(payment) {
  const currentUser = getCurrentUser();
  if (!currentUser) return "";
  
  const isAdmin = currentUser.role === 'admin';
  
  if (isAdmin && payment.isCompleted()) {
    return `<button class="btn-cancel-payment" data-id="${payment.id}">Rembourser</button>`;
  }
  
  if (isAdmin && payment.isPending()) {
    return `<button class="btn-cancel-payment" data-id="${payment.id}">Annuler</button>`;
  }
  
  if (!isAdmin && payment.isPending() && currentUser.id == payment.user_id) {
    return `
      <button class="btn-confirm-payment" data-id="${payment.id}">Confirmer</button>
      <button class="btn-cancel-payment" data-id="${payment.id}">Annuler</button>
    `;
  }
  
  return "";
}

export function renderPaymentForm(reservationId, amount) {
  return `
    <div class="payment-form-container">
      <h2>Effectuer un paiement</h2>
      <form id="payment-form">
        <input type="hidden" name="reservation_id" value="${reservationId}">
        <input type="hidden" name="amount" value="${amount}">
        
        <div class="form-group">
          <p class="payment-amount">Montant à payer: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)}</p>
        </div>
        
        <div class="form-group">
          <label>Méthode de paiement:</label>
          <div class="payment-method-options">
            <div class="payment-method-option">
              <input type="radio" id="cb" name="payment_method" value="cb" checked>
              <label for="cb">Carte bancaire</label>
            </div>
            <div class="payment-method-option">
              <input type="radio" id="paypal" name="payment_method" value="paypal">
              <label for="paypal">PayPal</label>
            </div>
          </div>
        </div>
        
        <div id="cb_details" class="payment-method-details">
          <div class="form-group">
            <label for="card_number">Numéro de carte:</label>
            <input type="text" id="card_number" name="card_number" placeholder="1234 5678 9012 3456">
          </div>
          <div class="form-group card-info-row">
            <div>
              <label for="card_expiry">Date d'expiration:</label>
              <input type="text" id="card_expiry" name="card_expiry" placeholder="MM/AA">
            </div>
            <div>
              <label for="card_cvv">CVV:</label>
              <input type="text" id="card_cvv" name="card_cvv" placeholder="123">
            </div>
          </div>
        </div>
        
        <div id="paypal_details" class="payment-method-details" style="display: none;">
          <div class="form-group">
            <label for="paypal_email">Email PayPal:</label>
            <input type="email" id="paypal_email" name="paypal_email" placeholder="exemple@email.com">
          </div>
        </div>
        
        <div class="form-group">
          <button type="submit" class="btn-primary">Payer</button>
          <button type="button" id="cancel-payment-form" class="btn-secondary">Annuler</button>
        </div>
        <div id="form-error" class="error-message"></div>
      </form>
    </div>
  `;
}