document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const themeToggle = document.getElementById('theme-toggle');
    const sidebarThemeToggle = document.getElementById('sidebar-theme-toggle');
    const body = document.body;
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('.section');

    // --- 1. Sidebar Toggle ---
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
        
        // Toggle body scroll lock
        if (sidebar.classList.contains('open')) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = '';
        }
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        body.style.overflow = '';
    }

    if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    // --- 2. Page Switching & Scroll Logic ---
    function updateScrollProgress() {
        const progressBar = document.getElementById('scroll-progress');
        if (progressBar) {
            const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + "%";
        }
    }

    // Scroll Spy for Active Sidebar Links
    function scrollSpy() {
        let currentSection = "";
        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop - 150) {
                currentSection = section.getAttribute("id");
            }
        });

        if (currentSection) {
            navLinks.forEach((link) => {
                link.classList.remove("active");
                if (link.getAttribute("href").includes(currentSection)) {
                    link.classList.add("active");
                }
            });
        }
    }

    window.addEventListener('scroll', () => {
        updateScrollProgress();
        scrollSpy();
    });

    function showSection(targetId) {
        // Remove active class from all sections and hide them
        sections.forEach(section => {
            section.classList.remove('active-section');
            section.style.display = 'none';
        });

        // Show target section
        const targetSection = document.getElementById(targetId.replace('#', ''));
        if (targetSection) {
            targetSection.style.display = 'flex';
            // Use a small timeout to trigger fade-in animation
            setTimeout(() => {
                targetSection.classList.add('active-section');
            }, 10);
        }

        // Update Nav Links
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === targetId);
        });

        // Scroll main content back to top
        document.querySelector('.main-content').scrollTop = 0;
    }

    // Handle Link Clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                showSection(targetId);
                window.location.hash = targetId; // Update URL
                
                // Auto-close sidebar on mobile after click
                if (sidebar.classList.contains('open')) {
                    closeSidebar();
                }
            }
        });
    });

    // Handle Initial Page Load & Back/Forward
    window.addEventListener('popstate', () => {
        const hash = window.location.hash || '#home';
        showSection(hash);
    });

    // Initial Load
    const initialHash = window.location.hash || '#home';
    showSection(initialHash);

    // --- 3. Theme Toggling ---
    function updateSidebarButtonText() {
        if (sidebarThemeToggle) {
            sidebarThemeToggle.textContent = body.classList.contains('dark-theme') 
                ? 'Switch to Light Mode' 
                : 'Switch to Dark Mode';
        }
    }

    function toggleTheme() {
        if (body.classList.contains('light-theme')) {
            body.classList.replace('light-theme', 'dark-theme');
            localStorage.setItem('theme', 'dark-theme');
        } else {
            body.classList.replace('dark-theme', 'light-theme');
            localStorage.setItem('theme', 'light-theme');
        }
        updateSidebarButtonText();
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(savedTheme);
    updateSidebarButtonText();

    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (sidebarThemeToggle) sidebarThemeToggle.addEventListener('click', toggleTheme);

    // --- 4. Typing Effect (Re-triggerable for Home) ---
    function runTypingEffect() {
        const textElement = document.querySelector('.typing-text');
        if (textElement) {
            const originalText = "Passionate about Artificial Intelligence, programming, and innovation.";
            textElement.textContent = '';
            let charIndex = 0;
            function typeWriter() {
                if (charIndex < originalText.length) {
                    textElement.textContent += originalText.charAt(charIndex);
                    charIndex++;
                    setTimeout(typeWriter, 40);
                }
            }
            setTimeout(typeWriter, 300);
        }
    }

    // Run typing effect on load
    runTypingEffect();

    // --- 5. Dynamic Content Loading ---
    async function loadDynamicContent() {
        try {
            // Add timestamp to prevent caching
            const response = await fetch('/api/data?t=' + Date.now());
            const data = await response.json();

            if (!response.ok || data.success === false) {
                console.error('API Error:', data.message);
                return; // Stop rendering if there's an error
            }

            // Render Home Stats
            const statsContainer = document.getElementById('home-stats-container');
            if (statsContainer && data.homeStats) {
                statsContainer.innerHTML = data.homeStats.map(stat => `
                    <div class="stat-card card">
                        <div class="stat-value">${stat.value}</div>
                        <div class="stat-label">${stat.label}</div>
                    </div>
                `).join('');
            }

            // Render Tech Stack
            const techContainer = document.getElementById('tech-stack-container');
            if (techContainer && data.techStack) {
                techContainer.innerHTML = data.techStack.map(tech => `
                    <div class="tech-item">${tech}</div>
                `).join('');
            }

            // Render Projects
            const projectsContainer = document.getElementById('projects-container');
            if (projectsContainer && data.projects) {
                projectsContainer.innerHTML = data.projects.map(project => `
                    <div class="card project-card">
                        <div class="project-placeholder" style="background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 12px; text-align: center; margin-bottom: 1.5rem; font-weight: 700;">${project.placeholder}</div>
                        <h3>${project.title}</h3>
                        <p>${project.description}</p>
                        <p class="tech-stack" style="color: var(--accent-color); margin-top: 1rem; font-weight: 600;">${project.techStack}</p>
                    </div>
                `).join('');
            }

            // Render Blog
            const blogContainer = document.getElementById('blog-container');
            if (blogContainer && data.blog) {
                blogContainer.innerHTML = data.blog.map(post => `
                    <div class="card">
                        <h3>${post.title}</h3>
                        <p class="date" style="color: var(--text-secondary); margin-bottom: 1rem;">${post.date}</p>
                        <p>${post.content}</p>
                    </div>
                `).join('');
            }

            // Render Skills
            const skillsContainer = document.getElementById('skills-container');
            if (skillsContainer && data.skills) {
                const skillsHtml = data.skills.map(skill => `
                    <div class="skill-group" style="margin-bottom: 1.5rem;">
                        <label>${skill.name}</label>
                        <div class="progress-bar"><div class="progress" style="width: ${skill.level}%;"></div></div>
                    </div>
                `).join('');
                skillsContainer.innerHTML = `<h3>Technical Skills</h3>` + skillsHtml;
            }

            // Render Achievements
            const achievementsContainer = document.getElementById('achievements-container');
            if (achievementsContainer && data.achievements) {
                achievementsContainer.innerHTML = data.achievements.map(ach => `
                    <div class="card achievement-card">
                        <div class="icon" style="color: var(--accent-color); margin-bottom: 1rem;">
                            <i data-lucide="${ach.icon}"></i>
                        </div>
                        <h3>${ach.title}</h3>
                        <p>${ach.description}</p>
                        <span class="date" style="color: var(--accent-color); font-weight: 700;">${ach.date}</span>
                    </div>
                `).join('');
            }

            // Render Certifications
            const certsContainer = document.getElementById('certs-container');
            if (certsContainer && data.certifications) {
                certsContainer.innerHTML = data.certifications.map(cert => `
                    <div class="card cert-card">
                        <h3>${cert.title}</h3>
                        <p>${cert.description}</p>
                    </div>
                `).join('');
            }

            // Initialize Lucide Icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Re-observe new cards for fade-in effect
            document.querySelectorAll('.card').forEach(card => fadeObserver.observe(card));

        } catch (error) {
            console.error('Error loading content:', error);
        }
    }

    // Run dynamic loading
    loadDynamicContent();

    // --- 6. Intersection Observer for Cards (Always running) ---
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, { threshold: 0.1 });

    // --- 7. Contact Form Handling ---
    function showToast(message, type = 'info') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);

        // Trigger show
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('.contact-submit');
            const originalBtnText = submitBtn.textContent;
            
            // Get form data
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const message = document.getElementById('contact-message').value;


            
            // Get reCAPTCHA token
            const recaptchaResponse = typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse() : '';
            
            if (!recaptchaResponse) {
                showToast('Please complete the reCAPTCHA', 'info');
                return;
            }

            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message, recaptchaResponse })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    showToast('Message sent successfully!', 'success');
                    contactForm.reset();
                    if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
                } else {
                    showToast('Error: ' + (result.message || 'Failed to send message'), 'error');
                }
            } catch (err) {
                console.error('Contact form error:', err);
                showToast('An error occurred. Please try again later.', 'error');
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});
