class BookingSystem {
    constructor() {
        this.basePrice = 15000;
        this.discounts = {
            '7': 0.05,
            '14': 0.10,
            '30': 0.15
        };
        this.currentLanguage = 'ru';
        this.apiKey = 'Xd9ZXqCTM2fgT6N7A';
        this.propertyId = 'F3KaSqPkbGQWTexfZ';
        this.apiBaseUrl = 'https://apartx.co/api/v1';
        this.init();
    }

    async init() {
        try {
            this.bookedDates = await this.fetchBookedDates();
            this.calendar = new BookingCalendar(
                document.getElementById('calendar-container'),
                this.bookedDates
            );
            this.setupEventListeners();
            this.i18n = new I18n();
            this.i18n.init();
        } catch (error) {
            console.error('Initialization error:', error);
            showToast('Ошибка инициализации системы бронирования', 'error');
        }
    }

    async fetchBookedDates() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/properties/${this.propertyId}/bookings`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await handleApiErrors(response);
            return data.bookings.map(booking => ({
                start: new Date(booking.check_in),
                end: new Date(booking.check_out)
            }));
            
        } catch (error) {
            console.error('Ошибка загрузки бронирований:', error);
            showToast(error.message, 'error');
            return [];
        }
    }

    async checkAvailability(startDate, endDate) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/properties/${this.propertyId}/availability`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0]
                })
            });
            
            const data = await handleApiErrors(response);
            return data.available;
            
        } catch (error) {
            console.error('Ошибка проверки доступности:', error);
            showToast(error.message, 'error');
            return false;
        }
    }

    setupEventListeners() {
        const form = document.getElementById('booking-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        const dateIn = document.getElementById('datein');
        const dateOut = document.getElementById('dateout');
        
        if (dateIn && dateOut) {
            dateIn.addEventListener('change', (e) => this.updatePriceSummary());
            dateOut.addEventListener('change', (e) => this.updatePriceSummary());
        }

        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => this.toggleLanguage());
        }
    }

    toggleLanguage() {
        const currentLang = this.i18n.currentLanguage;
        if (currentLang === 'ru') this.i18n.changeLanguage('kz');
        else if (currentLang === 'kz') this.i18n.changeLanguage('en');
        else this.i18n.changeLanguage('ru');
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const dateIn = new Date(formData.get('datein'));
        const dateOut = new Date(formData.get('dateout'));
        
        // Валидация
        if (dateIn >= dateOut) {
            showToast(this.i18n.t('booking.date_error'), 'error');
            return;
        }
        
        // Проверка доступности
        const isAvailable = await this.checkAvailability(dateIn, dateOut);
        if (!isAvailable) {
            showToast(this.i18n.t('booking.not_available'), 'error');
            return;
        }
        
        try {
            // Отправка бронирования в apartx.co
            const bookingResponse = await fetch(`${this.apiBaseUrl}/bookings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    property_id: this.propertyId,
                    check_in: dateIn.toISOString().split('T')[0],
                    check_out: dateOut.toISOString().split('T')[0],
                    guest_name: formData.get('name'),
                    guest_phone: formData.get('phone'),
                    guests: formData.get('guests'),
                    special_requests: formData.get('message'),
                    source: 'website',
                    status: 'pending'
                })
            });
            
            await handleApiErrors(bookingResponse);
            
            // Отправка уведомления в formspree
            const formspreeResponse = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (formspreeResponse.ok) {
                showToast(this.i18n.t('booking.success'), 'success');
                form.reset();
                this.calendar.clearSelection();
                document.getElementById('price-summary').style.display = 'none';
                
                // Обновляем календарь
                this.bookedDates = await this.fetchBookedDates();
                this.calendar.bookedDates = this.bookedDates;
                this.calendar.renderCalendar();
            } else {
                throw new Error('Formspree submission failed');
            }
            
        } catch (error) {
            console.error('Ошибка бронирования:', error);
            showToast(this.i18n.t('booking.error'), 'error');
        }
    }

    updatePriceSummary() {
        const dateIn = document.getElementById('datein');
        const dateOut = document.getElementById('dateout');
        
        if (!dateIn.value || !dateOut.value) return;
        
        const startDate = new Date(dateIn.value);
        const endDate = new Date(dateOut.value);
        
        if (startDate >= endDate) return;
        
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let price = this.basePrice * diffDays;
        let discount = 0;
        
        // Применяем скидки
        for (const [days, discountRate] of Object.entries(this.discounts)) {
            if (diffDays >= parseInt(days)) {
                discount = price * discountRate;
                price -= discount;
                break;
            }
        }
        
        // Обновляем UI
        document.getElementById('nights-count').textContent = diffDays;
        document.getElementById('price-per-night').textContent = `${this.basePrice.toLocaleString()} ₸`;
        document.getElementById('total-price').textContent = `${price.toLocaleString()} ₸`;
        
        const discountNotice = document.getElementById('discount-notice');
        if (discount > 0) {
            discountNotice.textContent = `Включена скидка ${(this.discounts[diffDays >= 30 ? '30' : diffDays >= 14 ? '14' : '7'] * 100}% за длительное проживание`;
            discountNotice.style.display = 'block';
        } else {
            discountNotice.style.display = 'none';
        }
        
        document.getElementById('price-summary').style.display = 'block';
    }
}