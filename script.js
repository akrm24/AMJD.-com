document.addEventListener('DOMContentLoaded', () => {

    // --- Preloader ---
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        if (preloader) {
            preloader.classList.add('hidden');
            preloader.addEventListener('transitionend', () => preloader.remove());
        }
    });

    // --- Header Elements ---
    const header = document.getElementById('header');
    const backToTopButton = document.getElementById('back-to-top');
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const navUl = document.getElementById('main-nav-ul'); // Get nav list by ID
    const scrollThreshold = 80;

    // --- Mobile Menu Toggle ---
    if (menuToggle && navUl) {
        menuToggle.addEventListener('click', () => {
            navUl.classList.toggle('open');
            const isExpanded = navUl.classList.contains('open');
            menuToggle.setAttribute('aria-expanded', isExpanded);
            // Optional: Prevent body scroll when menu is open
            // document.body.style.overflow = isExpanded ? 'hidden' : '';
        });
    }

    // --- Close Mobile Menu on Link Click ---
    const navLinks = document.querySelectorAll('#main-nav-ul a.nav-link'); // Select links inside the main nav
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Close menu only if it's open (on mobile view)
            if (navUl && navUl.classList.contains('open')) {
                navUl.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
                // document.body.style.overflow = ''; // Restore body scroll
            }
            // Smooth scroll for internal links
            const targetId = link.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                smoothScrollTo(targetId);
            }
            // Allow default behavior for external links (like data.html)
        });
    });


    // --- Header Scroll Effects & Back to Top Button ---
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;

        // Header shrink (only if it's not static)
        if (header && !header.classList.contains('static-header')) {
            if (scrollY > scrollThreshold) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        // Back to Top button visibility
        if (backToTopButton) {
            backToTopButton.classList.toggle('visible', scrollY > 300);
        }

        // Active Nav Link Highlighting (Only for index.html sections)
        // Check if we are on the index page by looking for a specific element
        const isIndexPage = !!document.getElementById('home'); // Check if #home exists
        if (isIndexPage) {
            updateActiveNavLink();
        }
    });

    // --- Smooth Scroll Function (Refactored) ---
    function smoothScrollTo(targetId) {
         if (targetId === '#home' || targetId === '#') { // Handle #home and simple # links
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const headerOffset = (header && !header.classList.contains('static-header')) ? header.offsetHeight : 0; // No offset for static header pages
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 15;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }
    // Back to top button click handler
     if (backToTopButton) {
        backToTopButton.addEventListener('click', (e) => {
            e.preventDefault();
            smoothScrollTo('#home'); // Use the smooth scroll function
        });
    }


    // --- Active Nav Link Highlighting Function (For index.html) ---
    const indexSections = document.querySelectorAll('#index-content section[data-section-id]'); // Assumes index content wrapped
    // Or more simply, get sections present ONLY in index.html by ID
    const sectionsForHighlighting = Array.from(document.querySelectorAll('section'))
        .filter(sec => ['home', 'library', 'secrets', 'about', 'contact'].includes(sec.id));

    function updateActiveNavLink() {
        let currentSectionId = '';
        const headerHeight = (header && !header.classList.contains('static-header')) ? header.offsetHeight : 0;
        const scrollPosition = window.pageYOffset + headerHeight + 50;

        sectionsForHighlighting.forEach(section => {
            if (section) { // Check if section exists on the page
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    currentSectionId = section.getAttribute('data-section-id') || section.id;
                }
            }
        });

        // Adjust for bottom and top edge cases
        if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 100) {
            const contactSection = document.getElementById('contact');
             if (contactSection) currentSectionId = 'contact';
        } else if (window.pageYOffset < 200) { // Simplified top check
             currentSectionId = 'home';
        }

        navLinks.forEach(link => {
            link.classList.remove('active');
            // Only highlight links pointing to sections (#...)
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    }
    // Initial call only if on index page
    if (document.getElementById('home')) {
        updateActiveNavLink();
    }

    // --- Intersection Observer (Common Logic - works on both pages if elements exist) ---
    const animatedElements = document.querySelectorAll('.content-scroll-reveal');
    const secretsTrigger = document.getElementById('secrets-trigger'); // Still looking on index
    const secretsSection = document.getElementById('secrets'); // Still looking on index

    // Check if secrets section exists before potentially revealing
    let secretsRevealed = !secretsSection; // If no secrets section, consider it "revealed"

    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // General Animations
                if (entry.target.classList.contains('content-scroll-reveal')) {
                     entry.target.classList.add('visible-animate');
                     observer.unobserve(entry.target);
                }
                // Secrets Section Trigger (only if section exists and not revealed)
                if (entry.target.id === 'secrets-trigger' && secretsSection && !secretsRevealed) {
                    secretsSection.classList.add('visible');
                    secretsRevealed = true;
                    observer.unobserve(entry.target); // Unobserve trigger
                    console.log("Secrets Revealed!");
                }
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    animatedElements.forEach(el => observer.observe(el));
    // Only observe trigger if it exists
    if (secretsTrigger) {
        observer.observe(secretsTrigger);
    }


    // --- Copy Wisdom Quote (data.html specific elements) ---
    const copyStatusDiv = document.getElementById('copy-status');
    // Make copyQuote globally available IF the button exists on the page
    if (document.querySelector('.copy-btn')) {
        window.copyQuote = function(buttonElement) {
            const quoteContainer = buttonElement.closest('.wisdom-quote');
            const quoteElement = quoteContainer ? quoteContainer.querySelector('p') : null;

            if (!quoteElement || !navigator.clipboard) {
                console.error("Quote element not found or clipboard API not supported.");
                if(copyStatusDiv) showStatusMessage(copyStatusDiv, 'فشل النسخ', false);
                return;
            }
            const quoteText = quoteElement.innerText;
            navigator.clipboard.writeText(quoteText).then(() => {
                if(copyStatusDiv) showStatusMessage(copyStatusDiv, 'تم نسخ الحكمة!', true);
                buttonElement.classList.add('copied');
                buttonElement.innerText = '✓ تم النسخ';
                buttonElement.disabled = true;
                setTimeout(() => {
                    buttonElement.classList.remove('copied');
                    buttonElement.innerText = 'نسخ';
                    buttonElement.disabled = false;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                 if(copyStatusDiv) showStatusMessage(copyStatusDiv, 'فشل النسخ!', false);
            });
        }
    }
    // Helper for copy status
    function showStatusMessage(element, message, isSuccess) {
        if (!element) return;
        element.innerText = message;
        element.classList.add('visible');
        element.style.color = isSuccess ? 'var(--accent-color)' : '#dc3545';
        setTimeout(() => { element.classList.remove('visible'); }, 2500);
    }


    // --- Wisdom Filter (data.html specific elements) ---
    const wisdomFilterInput = document.getElementById('wisdom-filter');
    const wisdomQuotes = document.querySelectorAll('#wisdom .wisdom-quote');
    if (wisdomFilterInput && wisdomQuotes.length > 0) {
        wisdomFilterInput.addEventListener('input', () => {
            const filterValue = wisdomFilterInput.value.toLowerCase().trim();
            wisdomQuotes.forEach(quote => {
                const quoteText = quote.querySelector('p')?.innerText.toLowerCase() || '';
                const authorText = quote.querySelector('span')?.innerText.toLowerCase() || '';
                quote.classList.toggle('hidden-by-filter', !(quoteText.includes(filterValue) || authorText.includes(filterValue)));
            });
        });
    }


    // --- Contact Form Submission (index.html specific elements) ---
    const contactForm = document.getElementById('contact-form');
    const formStatusDiv = document.getElementById('form-status');
    if (contactForm && formStatusDiv) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            formStatusDiv.classList.remove('visible', 'success', 'error');
            if (!contactForm.checkValidity()) {
                showFormStatus('يرجى ملء جميع الحقول المطلوبة بشكل صحيح.', false);
                contactForm.reportValidity();
                return;
            }
            const submitButton = contactForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerText = 'جاري الإرسال...';
            showFormStatus('جاري إرسال الرسالة...', true, true);

            try {
                await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
                const simulatedSuccess = true; // Test variable
                if (simulatedSuccess) {
                    console.log('Form Data:', new FormData(contactForm));
                    showFormStatus('شكرًا لك! تم استلام رسالتك بنجاح.', true);
                    contactForm.reset();
                } else {
                    throw new Error("Simulated server error");
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                showFormStatus('حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.', false);
            } finally {
                 submitButton.disabled = false;
                 submitButton.innerText = 'إرسال الرسالة';
            }
        });
    }
     // Helper for Contact Form Status
     function showFormStatus(message, isSuccess, isPending = false) {
         if (!formStatusDiv) return;
         formStatusDiv.innerText = message;
         formStatusDiv.classList.remove('success', 'error');
         if (!isPending) { formStatusDiv.classList.add(isSuccess ? 'success' : 'error'); }
         else { formStatusDiv.classList.add('success'); } // Pending style
         formStatusDiv.classList.add('visible');
     }

}); // End DOMContentLoaded