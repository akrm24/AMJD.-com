document.addEventListener('DOMContentLoaded', () => {

    // --- Preloader ---
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        if (preloader) {
            preloader.classList.add('hidden');
            preloader.addEventListener('transitionend', () => {
                if (preloader.parentElement) { // Check if it's still in DOM
                   preloader.remove();
                }
            });
        }
        // Trigger animations slightly after load if needed
        // document.body.classList.add('loaded');
    });

    // --- Header Scroll Effects ---
    const header = document.getElementById('header');
    const scrollThreshold = 50; // Shrink header sooner
    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;

        // Header shrink based on scroll position
        if (header) {
            if (scrollY > scrollThreshold) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        // Show/Hide Back to Top button
        const backToTopButton = document.getElementById('back-to-top');
        if (backToTopButton) {
             if (scrollY > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        }

        lastScrollTop = scrollY <= 0 ? 0 : scrollY; // For Mobile or negative scrolling
    }, { passive: true }); // Improve scroll performance

    // --- Smooth Scrolling for Back to Top ---
    const backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
        backToTopButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Mobile Menu Toggle ---
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            menuToggle.classList.toggle('open');
            const isExpanded = navMenu.classList.contains('open');
            menuToggle.setAttribute('aria-expanded', isExpanded);
            // Optional: Prevent body scroll when menu is open
            document.body.style.overflow = isExpanded ? 'hidden' : '';
        });

        // Close menu when a link is clicked
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('open')) {
                    navMenu.classList.remove('open');
                    menuToggle.classList.remove('open');
                    menuToggle.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = ''; // Restore body scroll
                }
            });
        });
         // Close menu if clicking outside of it (optional)
         document.addEventListener('click', (event) => {
             if (navMenu.classList.contains('open') && !header.contains(event.target)) {
                 navMenu.classList.remove('open');
                 menuToggle.classList.remove('open');
                 menuToggle.setAttribute('aria-expanded', 'false');
                 document.body.style.overflow = '';
             }
         });
    }

    // --- Active Nav Link Highlighting based on Current Page ---
    const currentPath = window.location.pathname.split('/').pop(); // Get the current file name
    const navLinks = document.querySelectorAll('#nav-menu .nav-link');

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop();
        // Handle index.html case
        if ((currentPath === '' || currentPath === 'index.html') && linkPath === 'index.html') {
            link.classList.add('active');
        } else if (linkPath !== 'index.html' && currentPath === linkPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });


    // --- Intersection Observer for Scroll Animations ---
    const animatedElements = document.querySelectorAll('.content-scroll-reveal');
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible-animate');
                observer.unobserve(entry.target); // Animate only once
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    animatedElements.forEach(el => observer.observe(el));


    // --- Copy Wisdom Quote --- (Will only work on index.html)
    const copyStatusDiv = document.getElementById('copy-status');
    // Make copyQuote globally available if called via onclick attribute
    window.copyQuote = function(buttonElement) {
        const quoteContainer = buttonElement.closest('.wisdom-quote');
        const quoteElement = quoteContainer ? quoteContainer.querySelector('p') : null;

        if (!quoteElement || !navigator.clipboard) {
            console.error("Quote element not found or clipboard API not supported.");
            if (copyStatusDiv) showStatusMessage(copyStatusDiv, 'فشل النسخ!', false);
            return;
        }

        const quoteText = quoteElement.innerText;
        navigator.clipboard.writeText(quoteText)
            .then(() => {
                if (copyStatusDiv) showStatusMessage(copyStatusDiv, 'تم نسخ الحكمة!', true);
                buttonElement.classList.add('copied');
                buttonElement.innerText = '✓ تم النسخ';
                buttonElement.disabled = true;
                setTimeout(() => {
                    buttonElement.classList.remove('copied');
                    buttonElement.innerText = 'نسخ';
                    buttonElement.disabled = false;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                if (copyStatusDiv) showStatusMessage(copyStatusDiv, 'فشل النسخ!', false);
            });
    }

    // --- Wisdom Filter --- (Will only work on index.html)
    const wisdomFilterInput = document.getElementById('wisdom-filter');
    const wisdomQuotes = document.querySelectorAll('#wisdom .wisdom-quote'); // Ensure this selector is specific enough if reused

    if (wisdomFilterInput && wisdomQuotes.length > 0) {
        wisdomFilterInput.addEventListener('input', () => {
            const filterValue = wisdomFilterInput.value.toLowerCase().trim();
            wisdomQuotes.forEach(quote => {
                const quoteText = quote.querySelector('p')?.innerText.toLowerCase() || '';
                const authorText = quote.querySelector('span')?.innerText.toLowerCase() || '';
                if (quoteText.includes(filterValue) || authorText.includes(filterValue)) {
                    quote.classList.remove('hidden-by-filter');
                } else {
                    quote.classList.add('hidden-by-filter');
                }
            });
        });
    }


    // --- Contact Form Handling (using Formspree) --- (Only on contact.html)
    const contactForm = document.getElementById('contact-form');
    const formStatusDiv = document.getElementById('form-status');

    if (contactForm && formStatusDiv) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default initially to show status
            formStatusDiv.classList.remove('visible', 'success', 'error');

            if (!contactForm.checkValidity()) {
                showFormStatus(formStatusDiv, 'يرجى ملء الحقول المطلوبة بشكل صحيح.', false);
                contactForm.reportValidity();
                return;
            }

            const formData = new FormData(contactForm);
            const submitButton = contactForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerText = 'جاري الإرسال...';
            showFormStatus(formStatusDiv, 'جاري الإرسال...', true, true); // Pending

            try {
                const response = await fetch(contactForm.action, {
                    method: contactForm.method,
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    // const result = await response.json(); // Optional: process result if needed
                    showFormStatus(formStatusDiv, 'شكرًا لك! تم إرسال رسالتك بنجاح.', true);
                    contactForm.reset();
                     // Hide status after delay
                     setTimeout(() => { formStatusDiv.classList.remove('visible'); }, 6000);
                } else {
                    // Try to get error message from Formspree response
                    let errorMessage = 'حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.';
                     try {
                         const errorData = await response.json();
                         if (errorData && errorData.errors) {
                             errorMessage = errorData.errors.map(error => error.message).join(', ');
                         }
                     } catch (jsonError) {
                         // Ignore if response isn't JSON
                     }
                    throw new Error(errorMessage);
                }

            } catch (error) {
                console.error('Form submission error:', error);
                showFormStatus(formStatusDiv, error.message || 'حدث خطأ أثناء الإرسال.', false);
            } finally {
                submitButton.disabled = false;
                submitButton.innerText = 'إرسال الرسالة';
            }
        });
    }

     // --- Book Suggestion Form Simulation --- (Only on book.html)
     const suggestionForm = document.getElementById('book-suggestion-form');
     const suggestionStatusDiv = document.getElementById('suggestion-status');

     if (suggestionForm && suggestionStatusDiv) {
         suggestionForm.addEventListener('submit', (e) => {
             e.preventDefault();
             if (!suggestionForm.checkValidity()) {
                  showStatusMessage(suggestionStatusDiv, 'يرجى ملء عنوان الكتاب على الأقل.', false);
                  suggestionForm.reportValidity();
                  return;
             }
             // Simulate sending
             const submitBtn = suggestionForm.querySelector('button[type="submit"]');
             submitBtn.disabled = true;
             submitBtn.innerText = 'جاري الإرسال...';
              showStatusMessage(suggestionStatusDiv, 'شكرًا لمشاركتك! (محاكاة)', true);
             setTimeout(() => {
                 suggestionForm.reset();
                 submitBtn.disabled = false;
                 submitBtn.innerText = 'إرسال المشاركة';
                  // Hide message
                 setTimeout(() => { suggestionStatusDiv.classList.remove('visible'); }, 4000);
             }, 1500);
         });
     }


    // --- Stats Counter Animation --- (Only on achievements.html)
    const counters = document.querySelectorAll('.stat-number[data-target]');
    if (counters.length > 0) {
         const counterObserverOptions = { threshold: 0.5 }; // Trigger when 50% visible
         const counterObserver = new IntersectionObserver((entries, observer) => {
             entries.forEach(entry => {
                 if (entry.isIntersecting) {
                     const counter = entry.target;
                     const target = +counter.getAttribute('data-target');
                     counter.innerText = '0'; // Start from 0

                     const updateCounter = () => {
                         const current = +counter.innerText;
                         const increment = target / 100; // Speed of animation

                         if (current < target) {
                             counter.innerText = `${Math.ceil(current + increment)}`;
                             // Slow down requestAnimationFrame for smoother feel
                             setTimeout(requestAnimationFrame, 20, updateCounter);
                         } else {
                             counter.innerText = target; // Ensure exact target number
                         }
                     };
                     requestAnimationFrame(updateCounter);
                     observer.unobserve(counter); // Animate only once
                 }
             });
         }, counterObserverOptions);

         counters.forEach(counter => counterObserver.observe(counter));
    }


    // --- Helper for showing Status Messages (Copy, Forms etc.) ---
    function showStatusMessage(element, message, isSuccess, isPending = false) {
        if (!element) return;
        element.innerText = message;
        element.classList.remove('success', 'error'); // Reset classes first
         if (!isPending) {
            element.classList.add(isSuccess ? 'success' : 'error');
         } else {
             element.classList.add('success'); // Use success style for pending
         }
        element.classList.add('visible');

         // Auto-hide non-pending messages after a delay
         if (!isPending) {
             setTimeout(() => {
                if (element) element.classList.remove('visible');
            }, 4000); // Hide after 4 seconds
         }
    }

     // --- Footer Current Year ---
     const yearSpan = document.getElementById('current-year');
     if(yearSpan) {
         yearSpan.textContent = new Date().getFullYear();
     }


}); // End DOMContentLoaded
