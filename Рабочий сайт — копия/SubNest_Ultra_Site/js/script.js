class BookingCalendar {
    constructor(container, bookedDates = [], options = {}) {
        this.container = container;
        this.bookedDates = bookedDates;
        this.options = {
            monthsToShow: 2,
            basePrice: 15000,
            ...options
        };
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.selectedRange = { start: null, end: null };
        
        this.init();
    }

    init() {
        this.renderCalendar();
        this.setupEventListeners();
    }

    renderCalendar() {
        this.container.innerHTML = '';
        
        const monthsContainer = document.createElement('div');
        monthsContainer.className = 'calendar-months-container';
        
        for (let i = 0; i < this.options.monthsToShow; i++) {
            const monthDate = new Date(this.currentYear, this.currentMonth + i, 1);
            const monthElement = this.renderSingleMonth(monthDate);
            monthsContainer.appendChild(monthElement);
        }
        
        this.container.appendChild(monthsContainer);
        this.renderLegend();
    }

    renderSingleMonth(monthDate) {
        const month = monthDate.getMonth();
        const year = monthDate.getFullYear();
        const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
        
        const monthContainer = document.createElement('div');
        monthContainer.className = 'calendar-month';
        
        const header = document.createElement('div');
        header.className = 'calendar-header';
        
        const title = document.createElement('h3');
        title.className = 'calendar-title';
        title.textContent = `${monthNames[month]} ${year}`;
        
        header.appendChild(title);
        monthContainer.appendChild(header);
        
        const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        const daysHeader = document.createElement('div');
        daysHeader.className = 'calendar-grid';
        
        dayNames.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day-header';
            dayElement.textContent = day;
            daysHeader.appendChild(dayElement);
        });
        
        monthContainer.appendChild(daysHeader);
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';
        
        for (let i = 0; i < startingDay; i++) {
            grid.appendChild(this.createDayElement(null, 'empty'));
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const dateStr = currentDate.toISOString().split('T')[0];
            
            let dayType = 'available';
            let tooltipText = '';
            
            if (currentDate.toDateString() === new Date().toDateString()) {
                dayType = 'today';
                tooltipText = 'Сегодня';
            } 
            else if (currentDate < new Date().setHours(0,0,0,0)) {
                dayType = 'past';
                tooltipText = 'Прошедшая дата';
            }
            else if (this.isDateBooked(currentDate)) {
                dayType = 'booked';
                tooltipText = 'Забронировано';
            }
            
            if (this.selectedRange.start && this.selectedRange.end) {
                if (currentDate >= this.selectedRange.start && currentDate <= this.selectedRange.end) {
                    dayType = 'selected';
                }
            }
            
            grid.appendChild(this.createDayElement(day, dayType, dateStr, tooltipText));
        }
        
        monthContainer.appendChild(grid);
        return monthContainer;
    }

    isDateBooked(date) {
        return this.bookedDates.some(booking => {
            return date >= booking.start && date <= booking.end;
        });
    }

    createDayElement(day, type, dateStr = null, tooltipText = '') {
        const dayElement = document.createElement('div');
        dayElement.className = `calendar-day ${type}`;
        
        if (day) {
            dayElement.textContent = day;
            if (dateStr) dayElement.dataset.date = dateStr;
            
            if (tooltipText) {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = tooltipText;
                dayElement.appendChild(tooltip);
            }
        }
        
        return dayElement;
    }

    renderLegend() {
        const legend = document.createElement('div');
        legend.className = 'legend';
        
        const legendItems = [
            { color: 'available', label: 'Доступно' },
            { color: 'booked', label: 'Забронировано' },
            { color: 'selected', label: 'Выбрано' },
            { color: 'today', label: 'Сегодня' }
        ];
        
        legendItems.forEach(item => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            
            const color = document.createElement('div');
            color.className = `legend-color ${item.color}`;
            
            const label = document.createElement('span');
            label.textContent = item.label;
            
            legendItem.appendChild(color);
            legendItem.appendChild(label);
            legend.appendChild(legendItem);
        });
        
        this.container.appendChild(legend);
    }

    setupEventListeners() {
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('prev-month')) {
                this.currentMonth--;
                if (this.currentMonth < 0) {
                    this.currentMonth = 11;
                    this.currentYear--;
                }
                this.renderCalendar();
                this.setupDaySelection();
            } else if (e.target.classList.contains('next-month')) {
                this.currentMonth++;
                if (this.currentMonth > 11) {
                    this.currentMonth = 0;
                    this.currentYear++;
                }
                this.renderCalendar();
                this.setupDaySelection();
            }
        });
        
        this.setupDaySelection();
    }

    setupDaySelection() {
        const days = this.container.querySelectorAll('.calendar-day:not(.past):not(.booked):not(.empty)');
        
        days.forEach(day => {
            day.addEventListener('click', () => {
                const dateStr = day.dataset.date;
                const date = new Date(dateStr);
                
                if (!this.selectedRange.start || (this.selectedRange.start && this.selectedRange.end)) {
                    this.selectedRange = { start: date, end: null };
                    this.clearSelection();
                    day.classList.add('selected');
                    
                    document.getElementById('datein').value = this.formatDate(date);
                    document.getElementById('dateout').value = '';
                } else if (date > this.selectedRange.start) {
                    this.selectedRange.end = date;
                    this.selectRange(this.selectedRange.start, this.selectedRange.end);
                    
                    document.getElementById('datein').value = this.formatDate(this.selectedRange.start);
                    document.getElementById('dateout').value = this.formatDate(this.selectedRange.end);
                    
                    const event = new Event('change');
                    document.getElementById('dateout').dispatchEvent(event);
                } else if (date < this.selectedRange.start) {
                    this.selectedRange = { start: date, end: null };
                    this.clearSelection();
                    day.classList.add('selected');
                    
                    document.getElementById('datein').value = this.formatDate(date);
                    document.getElementById('dateout').value = '';
                }
            });
        });
    }

    clearSelection() {
        const selected = this.container.querySelectorAll('.selected');
        selected.forEach(el => el.classList.remove('selected'));
    }

    selectRange(start, end) {
        this.clearSelection();
        
        const days = this.container.querySelectorAll('.calendar-day');
        days.forEach(day => {
            if (!day.dataset.date) return;
            
            const dayDate = new Date(day.dataset.date);
            if (dayDate >= start && dayDate <= end) {
                day.classList.add('selected');
            }
        });
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const fadeElements = document.querySelectorAll('.fade-in');
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach(el => fadeObserver.observe(el));

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
});

async function handleApiErrors(response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMsg);
    }
    return response.json();
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('visible'), 100);
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}