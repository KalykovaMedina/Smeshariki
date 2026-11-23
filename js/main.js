/* ============================================================
   MAIN.JS — рендеринг контента из content.js и интерактив
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const C = window.SITE_CONTENT || SITE_CONTENT;

  /* ---------- 1. Простая подстановка по data-content ---------- */
  document.querySelectorAll('[data-content]').forEach(el => {
    const path = el.dataset.content.split('.');
    let value = C;
    path.forEach(key => { if (value != null) value = value[key]; });
    if (value != null && typeof value !== 'object') {
      el.textContent = value;
    }
  });
    /* ---------- 1.1. Hero-изображение ---------- */
  const heroImage = document.getElementById('heroImage');
  if (heroImage && C.images && C.images.hero) {
    heroImage.src = C.images.hero;
    heroImage.alt = C.images.heroAlt || '';
    heroImage.addEventListener('load', () => heroImage.classList.add('is-loaded'));
    heroImage.addEventListener('error', () => {
      // Фолбэк: прячем картинку, оставляем орбиту
      heroImage.style.display = 'none';
    });
  }

  /* ---------- 2. Основные события ---------- */
  const keyEventsList = document.getElementById('keyEventsList');
  if (keyEventsList) {
    C.cartoon.keyEvents.forEach(ev => {
      const li = document.createElement('li');
      li.textContent = ev;
      keyEventsList.appendChild(li);
    });
  }

  /* ---------- 3. Персонажи (с аватарками) ---------- */
  const charactersList = document.getElementById('charactersList');
  if (charactersList) {
    const fallbackEmoji = { "Копатыч": "🐻", "Кар-Карыч": "🐦" };

    C.cartoon.mainCharacters.forEach(ch => {
      const li = document.createElement('li');

      const imgSrc = C.images && C.images.characters && C.images.characters[ch.name];

      if (imgSrc) {
        const avatar = document.createElement('img');
        avatar.className = 'character-avatar';
        avatar.src = imgSrc;
        avatar.alt = ch.name;
        avatar.loading = 'lazy';
        avatar.decoding = 'async';

        // Если картинка не загрузилась — подставляем эмодзи
        avatar.addEventListener('error', () => {
          const fb = document.createElement('span');
          fb.className = 'character-avatar-fallback';
          fb.setAttribute('aria-hidden', 'true');
          fb.textContent = fallbackEmoji[ch.name] || '🎬';
          avatar.replaceWith(fb);
        });

        li.appendChild(avatar);
      } else {
        const fb = document.createElement('span');
        fb.className = 'character-avatar-fallback';
        fb.setAttribute('aria-hidden', 'true');
        fb.textContent = fallbackEmoji[ch.name] || '🎬';
        li.appendChild(fb);
      }

      const textWrap = document.createElement('div');
      textWrap.className = 'character-text';

      const strong = document.createElement('strong');
      strong.textContent = ch.name;

      textWrap.appendChild(strong);
      textWrap.appendChild(document.createTextNode(' — ' + ch.role));

      li.appendChild(textWrap);
      charactersList.appendChild(li);
    });
  }

  /* ---------- 4. Интересные особенности ---------- */
  const factsList = document.getElementById('factsList');
  if (factsList) {
    C.cartoon.interestingFacts.forEach(f => {
      const li = document.createElement('li');
      li.textContent = f;
      factsList.appendChild(li);
    });
  }

  /* ---------- 5. Главный смысл (с innerHTML для тултипов) ---------- */
  const meaningHeadline = document.getElementById('meaningHeadline');
  const meaningText = document.getElementById('meaningText');
  const meaningRelevance = document.getElementById('meaningRelevance');
  if (meaningHeadline) meaningHeadline.textContent = C.mainMeaning.headline;
  if (meaningText) meaningText.innerHTML = C.mainMeaning.text;
  if (meaningRelevance) meaningRelevance.textContent = C.mainMeaning.relevance;

  /* ---------- 6. Карточки уроков ---------- */
  const lessonsGrid = document.getElementById('lessonsGrid');
  if (lessonsGrid) {
    C.lessons.forEach(lesson => {
      const card = document.createElement('div');
      card.className = 'lesson-card reveal';

      const icon = document.createElement('span');
      icon.className = 'lesson-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = lesson.icon;

      const title = document.createElement('h3');
      title.textContent = lesson.title;

      const desc = document.createElement('p');
      desc.textContent = lesson.description;

      card.append(icon, title, desc);
      lessonsGrid.appendChild(card);
    });
  }

  /* ---------- 7. Видео ---------- */
  const videoContainer = document.getElementById('videoContainer');
  if (videoContainer) {
    const { embedUrl, officialUrl, fallbackMessage } = C.video;

    if (embedUrl && embedUrl.includes('video_ext.php')) {
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.title = 'Просмотр серии «' + C.cartoon.episodeName + '»';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      videoContainer.appendChild(iframe);
    } else if (officialUrl) { // <--- Убрали лишнюю }
      const card = document.createElement('a');
      card.href = officialUrl;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.className = 'video-poster';

      if (C.video.poster) {
        const img = document.createElement('img');
        img.src = C.video.poster;
        img.alt = C.video.posterAlt || '';
        img.loading = 'lazy';
        card.appendChild(img);
      }

      const play = document.createElement('span');
      play.className = 'video-poster-play';
      play.setAttribute('aria-hidden', 'true');
      play.textContent = '▶';

      const label = document.createElement('span');
      label.className = 'video-poster-label';
      label.textContent = 'Перейти к просмотру';

      card.append(play, label);
      videoContainer.appendChild(card);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'video-placeholder';
      const msg = document.createElement('p');
      msg.textContent = fallbackMessage;
      placeholder.appendChild(msg);
      videoContainer.appendChild(placeholder);
    }
  }

  /* ---------- 8. Мини-квиз (пошаговый) + Открытый вопрос ---------- */
  const quizContainer = document.getElementById('quizContainer');
  const quizResult = document.getElementById('quizResult');
  const quizRestart = document.getElementById('quizRestart');

  let currentQuestionIndex = 0;
  let correctAnswersCount = 0;

  function showQuestion() {
    if (!quizContainer || !C.quiz) return;
    quizContainer.innerHTML = '';

    if (currentQuestionIndex >= C.quiz.length) {
      showOpenQuestion();
      return;
    }

    const q = C.quiz[currentQuestionIndex];
    const block = document.createElement('div');
    block.className = 'quiz-question quiz-fade-in';

    const title = document.createElement('h3');
    title.textContent = `${currentQuestionIndex + 1}. ${q.question}`;
    block.appendChild(title);

    const optionsWrap = document.createElement('div');
    optionsWrap.className = 'quiz-options';

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.type = 'button';
      btn.textContent = opt;

      btn.addEventListener('click', () => {
        optionsWrap.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);
        const isCorrect = optIndex === q.correct;
        
        if (isCorrect) {
          correctAnswersCount++;
          btn.classList.add('correct');
        } else {
          btn.classList.add('wrong');
          optionsWrap.querySelectorAll('.quiz-option')[q.correct].classList.add('correct');
        }

        setTimeout(() => {
          currentQuestionIndex++;
          showQuestion();
        }, 1200);
      });

      optionsWrap.appendChild(btn);
    });

    block.appendChild(optionsWrap);
    quizContainer.appendChild(block);
  }

  function showOpenQuestion() {
    if (quizResult) quizResult.hidden = true;
    quizContainer.innerHTML = '';

    const scoreText = document.createElement('p');
    scoreText.className = 'quiz-score-text';
    scoreText.innerHTML = `Вы ответили правильно на <strong>${correctAnswersCount} из ${C.quiz.length}</strong> вопросов.`;
    quizContainer.appendChild(scoreText);

    const openBlock = document.createElement('div');
    openBlock.className = 'quiz-open-question quiz-fade-in';

    const title = document.createElement('h3');
    title.textContent = C.openQuestion.title;
    
    const text = document.createElement('p');
    text.className = 'open-question-text';
    text.textContent = C.openQuestion.text;

    const textarea = document.createElement('textarea');
    textarea.className = 'quiz-textarea';
    textarea.placeholder = C.openQuestion.placeholder;
    textarea.rows = 3;

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-primary';
    submitBtn.type = 'button';
    submitBtn.textContent = C.openQuestion.buttonText;
    submitBtn.disabled = true;

    textarea.addEventListener('input', () => {
      submitBtn.disabled = textarea.value.trim().length < 10;
    });

    submitBtn.addEventListener('click', () => {
      const userText = textarea.value.trim();
      const savedBlock = document.getElementById('userSavedAnswer');
      const savedText = document.getElementById('userAnswerText');
      
      if (savedBlock && savedText) {
        savedText.textContent = `«${userText}»`;
        savedBlock.hidden = false;
      }

      quizContainer.innerHTML = '';
      if (quizResult) quizResult.hidden = true;
      
      const conclusionSection = document.getElementById('conclusion');
      if (conclusionSection) {
        conclusionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        conclusionSection.classList.add('highlight-conclusion');
        setTimeout(() => conclusionSection.classList.remove('highlight-conclusion'), 2000);
      }
    });

    openBlock.append(title, text, textarea, submitBtn);
    quizContainer.appendChild(openBlock);
  }

  if (quizRestart) {
    quizRestart.addEventListener('click', () => {
      currentQuestionIndex = 0;
      correctAnswersCount = 0;
      if (quizResult) quizResult.hidden = true;
      quizRestart.hidden = true;
      showQuestion();
    });
  }

  showQuestion();

  /* ---------- 9. Итог (Печатная машинка) ---------- */
  const conclusionText = document.getElementById('conclusionText');
  const finalPhrase = document.getElementById('finalPhrase');
  
  if (conclusionText) conclusionText.textContent = C.conclusion.text;
  
  // Печатная машинка для финальной фразы
  if (finalPhrase) {
    const phraseText = '«' + C.conclusion.finalPhrase + '»';
    finalPhrase.textContent = ''; 
    let charIndex = 0;

    const typeWriter = () => {
      if (charIndex < phraseText.length) {
        finalPhrase.textContent += phraseText.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, 80); 
      }
    };

    const phraseObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(typeWriter, 600);
          phraseObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    phraseObserver.observe(finalPhrase);
  }

  /* ---------- 10. Мобильное меню ---------- */
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (mainNav.classList.contains('open')) {
          mainNav.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /* ---------- 11. Плавный скролл ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });

  /* ---------- 12. Добавляем .reveal к основным блокам ---------- */
  const revealTargets = document.querySelectorAll(
    '.section-title, .about-grid .glass-card, .meaning-content, .quiz-card, .conclusion-content, .video-wrapper, .hero-content'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  /* ---------- 13. Пасхалка Крош ---------- */
  const eggBtn = document.getElementById('eggBtn');
  const eggBubble = document.getElementById('eggBubble');
  let eggTimeout;

  if (eggBtn && eggBubble && C.easterEgg) {
    eggBtn.addEventListener('click', () => {
      const randomQuote = C.easterEgg.quotes[Math.floor(Math.random() * C.easterEgg.quotes.length)];
      eggBubble.textContent = randomQuote;
      
      eggBubble.classList.add('show');
      
      clearTimeout(eggTimeout);
      eggTimeout = setTimeout(() => {
        eggBubble.classList.remove('show');
      }, 4000);
    });
  }

  // Сообщаем animations.js, что контент готов
  document.dispatchEvent(new CustomEvent('content:ready'));
});
  /* ---------- 14. Пузыри при клике ---------- */
  document.addEventListener('click', (e) => {
    // Создаем 6 пузырей на каждый клик
    for (let i = 0; i < 6; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'click-bubble';
      
      // Берем случайный цвет из палитры Смешариков
      const colors = ['#ff7a00', '#00d2ff', '#ffd000', '#4fc3f7'];
      bubble.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      
      // Позиционируем там, где был клик
      bubble.style.left = `${e.pageX}px`;
      bubble.style.top = `${e.pageY}px`;
      
      // Случайный разлет
      const randomX = (Math.random() - 0.5) * 100;
      const randomY = (Math.random() - 0.5) * 100;
      bubble.style.setProperty('--x', `${randomX}px`);
      bubble.style.setProperty('--y', `${randomY}px`);
      
      document.body.appendChild(bubble);
      
      // Удаляем пузырь из DOM после анимации (чтобы не засорять страницу)
      setTimeout(() => {
        bubble.remove();
      }, 800);
    }
  });
    /* ---------- 15. Подсветка меню при скролле ---------- */
  const navLinks = document.querySelectorAll('.main-nav a');
  const sections = document.querySelectorAll('main section');

  if (navLinks.length > 0 && sections.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', // Срабатывает, когда секция находится в верхней части экрана
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Убираем активный класс у всех ссылок
          navLinks.forEach(link => link.classList.remove('active'));
          
          // Находим ссылку, которая ведет на эту секцию
          const activeId = entry.target.getAttribute('id');
          const activeLink = document.querySelector(`.main-nav a[href="#${activeId}"]`);
          
          // Добавляем ей класс active
          if (activeLink) {
            activeLink.classList.add('active');
          }
        }
      });
    }, observerOptions);

    sections.forEach(section => {
      observer.observe(section);
    });
  }