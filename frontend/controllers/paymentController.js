import { fetchJSON, postJSON } from '../core/fetchWrapper.js';
import { Payment } from '../models/payment.js';
import { renderPayments, renderPaymentForm, renderOwnerPayments } from '../views/paymentView.js';
import { getCurrentUser } from '../controllers/authController.js';

export async function loadPayments() {
  try {
    let paymentListContainer = document.getElementById('payment-list');
    if (!paymentListContainer) {
      console.log("Conteneur de liste des paiements non trouvé, création d'un nouveau conteneur");
      const appContent = document.getElementById('app-content');
      if (appContent) {
        appContent.innerHTML = `
          <h1>Mes Paiements</h1>
          <div id="payment-list">
            <div class="loading">Chargement des paiements...</div>
          </div>
        `;
        paymentListContainer = document.getElementById('payment-list');
      } else {
        console.error("Conteneur app-content introuvable");
        return;
      }
    }
    
    console.log("Chargement des paiements...");
    paymentListContainer.innerHTML = '<div class="loading">Chargement des paiements...</div>';
    
    const response = await fetch("/app-gestion-parking/public/api/payments");
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP! Statut: ${response.status}`);
    }
    
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erreur de parsing JSON:", parseError);
      console.error("Réponse brute:", responseText);
      throw new Error("La réponse du serveur n'est pas au format JSON valide");
    }
    
    console.log("Données de paiements reçues:", data);
    
    if (!Array.isArray(data)) {
      console.error("Format de données incorrect:", data);
      paymentListContainer.innerHTML = `
        <div class="error-message">
          <h2>Erreur de format</h2>
          <p>Le format des données reçues est incorrect.</p>
          <p>Erreur: ${data.error || "Format de données non valide"}</p>
        </div>
      `;
      return;
    }
    
    const currentUser = getCurrentUser();
    const isOwner = currentUser && currentUser.role === 'owner';
    
    const payments = data.map(payment => new Payment(
      payment.id,
      payment.reservation_id,
      payment.amount,
      payment.method,
      payment.status,
      payment.timestamp,
      payment.user_id,
      payment.spot_id,
      payment.is_owner_spot || false
    ));
    
    if (isOwner) {
      const userPayments = payments.filter(p => !p.is_owner_spot);
      const ownerSpotPayments = payments.filter(p => p.is_owner_spot);
      
      const completedPayments = ownerSpotPayments.filter(p => p.isCompleted());
      const pendingPayments = ownerSpotPayments.filter(p => p.isPending());
      
      const totalAmount = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      renderOwnerPayments(userPayments, ownerSpotPayments, totalAmount);
    } else {
      renderPayments(payments);
    }
    
    setupPaymentEvents();
  } catch (error) {
    console.error("Erreur lors du chargement des paiements:", error);
    
    const container = document.getElementById('payment-list') || document.getElementById('app-content');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <h2>Erreur de chargement</h2>
          <p>${error.message}</p>
        </div>
      `;
    }
  }
}
export async function getPayment(id) {
  try {
    const data = await fetchJSON(`/app-gestion-parking/public/api/payments/${id}`);
    return new Payment(
      data.id,
      data.reservation_id,
      data.amount,
      data.method,
      data.status,
      data.timestamp
    );
  } catch (error) {
    console.error(`Erreur lors de la récupération du paiement ${id}:`, error);
    return null;
  }
}

export async function processPayment(reservationId, amount, method, paymentData = {}) {
  try {
    const data = {
      reservation_id: reservationId,
      amount: amount,
      method: method,
      ...paymentData
    };
    
    const response = await postJSON("/app-gestion-parking/public/api/payments/process", data);
    
    if (response.success) {
      await confirmPayment(response.payment_id);
    }
    
    return response;
  } catch (error) {
    console.error("Erreur lors du traitement du paiement:", error);
    return { error: error.message };
  }
}

export async function confirmPayment(id) {
  try {
    const response = await postJSON(`/app-gestion-parking/public/api/payments/${id}/confirm`, {});
    return response;
  } catch (error) {
    console.error(`Erreur lors de la confirmation du paiement ${id}:`, error);
    return { error: error.message };
  }
}

export async function cancelPayment(id) {
  try {
    const response = await postJSON(`/app-gestion-parking/public/api/payments/${id}/cancel`, {});
    return response;
  } catch (error) {
    console.error(`Erreur lors de l'annulation du paiement ${id}:`, error);
    return { error: error.message };
  }
}

export function setupPaymentEvents() {
  document.querySelectorAll('.btn-confirm-payment').forEach(button => {
    button.addEventListener('click', async () => {
      const paymentId = button.getAttribute('data-id');
      try {
        const result = await confirmPayment(paymentId);
        if (result.success) {
          alert("Paiement confirmé avec succès");
          loadPayments();
        } else {
          alert("Erreur: " + result.error);
        }
      } catch (error) {
        console.error("Erreur:", error);
        alert("Une erreur est survenue");
      }
    });
  });

  document.querySelectorAll('.btn-cancel-payment').forEach(button => {
    button.addEventListener('click', async () => {
      const paymentId = button.getAttribute('data-id');
      const currentUser = getCurrentUser();
      const isAdmin = currentUser && currentUser.role === 'admin';
      
      let confirmMessage = "Êtes-vous sûr de vouloir annuler ce paiement ?";
      if (isAdmin) {
        const paymentStatus = button.closest('.payment-card').querySelector('.status-completed');
        if (paymentStatus) {
          confirmMessage = "Êtes-vous sûr de vouloir rembourser ce paiement ?";
        }
      }
      
      if (confirm(confirmMessage)) {
        try {
          const result = await cancelPayment(paymentId);
          if (result.success) {
            alert(result.message);
            loadPayments();
          } else {
            alert("Erreur: " + result.error);
          }
        } catch (error) {
          console.error("Erreur:", error);
          alert("Une erreur est survenue");
        }
      }
    });
  });
}

export function showPaymentForm(reservationId, amount) {
  console.log("showPaymentForm appelé avec:", reservationId, amount);
  
  if (!reservationId && window.paymentData) {
    reservationId = window.paymentData.reservationId;
    amount = window.paymentData.amount;
    console.log("Données récupérées depuis window.paymentData:", reservationId, amount);
  }

  if (!reservationId) {
    const urlParams = new URLSearchParams(window.location.search);
    reservationId = urlParams.get('reservation_id');
    amount = urlParams.get('amount');
    console.log("Données récupérées depuis l'URL:", reservationId, amount);
  }

  if (typeof amount === 'string') {
    amount = parseFloat(amount);
  }
  
  const modalContainer = document.createElement('div');
  modalContainer.className = 'modal-container';
  modalContainer.id = 'payment-modal';
  
  function continueWithPayment() {
    console.log("Affichage du formulaire de paiement avec:", reservationId, amount);
    const container = document.getElementById('payment-gateway-container');
    
    modalContainer.innerHTML = renderPaymentForm(reservationId, amount);
    
    if (container) {
      container.innerHTML = '';
      container.appendChild(modalContainer);
    } else {
      document.body.appendChild(modalContainer);
    }
    
    const form = document.getElementById('payment-form');
    const cancelBtn = document.getElementById('cancel-payment-form');
    
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const method = document.querySelector('input[name="payment_method"]:checked').value;
        const errorElement = document.getElementById('form-error');
        
        try {
          let paymentData = {};
          
          if (method === 'cb') {
            paymentData = {
              card_number: document.getElementById('card_number').value,
              card_expiry: document.getElementById('card_expiry').value,
              card_cvv: document.getElementById('card_cvv').value
            };
          } else if (method === 'paypal') {
            paymentData = {
              paypal_email: document.getElementById('paypal_email').value
            };
          }
          
          const submitButton = form.querySelector('button[type="submit"]');
          submitButton.disabled = true;
          submitButton.textContent = 'Traitement en cours...';
          
          const result = await processPayment(reservationId, amount, method, paymentData);
          
          if (result.success) {
            const container = document.getElementById('payment-gateway-container');
            if (container) {
              container.innerHTML = `
                <div class="success-message">
                  <h2>Paiement effectué avec succès!</h2>
                  <p>Votre réservation a été confirmée.</p>
                  <a href="/app-gestion-parking/public/payments" class="btn-primary">Voir mes paiements</a>
                </div>
              `;
            } else {
              document.body.removeChild(modalContainer);
              alert("Paiement effectué avec succès!");
              window.location.href = "/app-gestion-parking/public/payments";
            }
          } else {
            submitButton.disabled = false;
            submitButton.textContent = 'Payer';
            errorElement.textContent = result.error || "Une erreur est survenue lors du paiement";
          }
        } catch (error) {
          console.error("Erreur:", error);
          errorElement.textContent = "Une erreur est survenue lors du paiement";
        }
      });
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        const container = document.getElementById('payment-gateway-container');
        if (container) {
          container.innerHTML = `
            <div class="info-message">
              <p>Paiement annulé.</p>
              <a href="/app-gestion-parking/public/reservations" class="btn-primary">Retour aux réservations</a>
            </div>
          `;
        } else {
          document.body.removeChild(modalContainer);
          window.location.href = "/app-gestion-parking/public/reservations";
        }
      });
    }
    
    setupPaymentMethodToggle();
  }

  if (!reservationId || isNaN(amount)) {
    console.error("Données invalides pour le paiement:", reservationId, amount);
    const container = document.getElementById('payment-gateway-container');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <h2>Données de paiement manquantes</h2>
          <p>Impossible de charger le formulaire de paiement. Données requises non fournies.</p>
          <a href="/app-gestion-parking/public/reservations" class="btn-primary">Retour aux réservations</a>
        </div>
      `;
    }
    return;
  }

  if (!isNaN(amount) && amount > 0) {
    continueWithPayment();
  } else {
    import('../controllers/reservationController.js').then(async module => {
      try {
        const reservation = await module.getReservation(reservationId);
        if (reservation) {
          import('./pricingController.js').then(async pricingModule => {
            try {
              const result = await pricingModule.calculatePrice(
                reservation.spot_id,
                reservation.start_time,
                reservation.end_time
              );
              
              if (!result.error) {
                amount = result.price;
              } else {
                amount = 5.00;
              }
              continueWithPayment();
            } catch (err) {
              console.error("Erreur lors du calcul du prix:", err);
              amount = 5.00;
              continueWithPayment();
            }
          });
        } else {
          amount = 5.00;
          continueWithPayment();
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la réservation:", error);
        amount = 5.00;
        continueWithPayment();
      }
    });
  }
  
  function setupPaymentMethodToggle() {
    const paymentMethodInputs = document.querySelectorAll('input[name="payment_method"]');
    const paymentDetails = document.querySelectorAll('.payment-method-details');
    
    if (paymentMethodInputs.length === 0) return;
    
    paymentMethodInputs.forEach(input => {
      input.addEventListener('change', () => {
        paymentDetails.forEach(detail => {
          detail.style.display = 'none';
        });
        
        const selectedMethod = document.querySelector('input[name="payment_method"]:checked');
        if (selectedMethod) {
          const detailsElement = document.getElementById(`${selectedMethod.value}_details`);
          if (detailsElement) {
            detailsElement.style.display = 'block';
          }
        }
      });
    });
    
    const cbDetails = document.getElementById('cb_details');
    if (cbDetails) {
      cbDetails.style.display = 'block';
    }
  }
}

export async function refreshPaymentStatuses() {
  try {
    const payments = document.querySelectorAll('.payment-card');
    if (payments.length === 0) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const pendingPayments = Array.from(payments)
      .filter(card => card.querySelector('.status-pending'))
      .map(card => ({
        id: card.dataset.id,
        isOwner: card.dataset.userId && card.dataset.userId == currentUser.id
      }))
      .filter(payment => payment.id && payment.id !== 'undefined' && payment.isOwner);
    
    if (pendingPayments.length === 0) return;
    
    console.log("Vérification des statuts pour les paiements:", pendingPayments.map(p => p.id));
    
    for (const payment of pendingPayments) {
      try {
        const data = await fetchJSON(`/app-gestion-parking/public/api/payments/${payment.id}`);
        if (data && data.status === 'effectue') {
          const statusElement = document.querySelector(`.payment-card[data-id="${payment.id}"] .payment-status`);
          if (statusElement) {
            statusElement.textContent = "Effectué";
            statusElement.className = "payment-status status-completed";
          }
        }
      } catch (err) {
        if (err.message && !err.message.includes('status: 403')) {
          console.error(`Erreur lors de la vérification du paiement ${payment.id}:`, err);
        }
      }
    }
  } catch (error) {
    console.error("Erreur lors du rafraîchissement des statuts:", error);
  }
}