(function () {
  'use strict';

  const STORAGE_KEY = 'we-chill.templates.v1';
  const DEFAULT_REST_SEC = 90;
  const DEFAULT_SET_REPS = 8;

  function createId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function formatDuration(seconds) {
    const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, '0')}`;
  }

  function parseDuration(input, fallbackSeconds) {
    const fallback = Math.max(0, Math.floor(Number(fallbackSeconds) || 0));
    if (input == null) return fallback;

    const raw = String(input).trim();
    if (!raw) return fallback;

    if (/^\d+$/.test(raw)) {
      return Math.max(0, parseInt(raw, 10));
    }

    const match = raw.match(/^(\d+):(\d{1,2})$/);
    if (!match) return fallback;
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) return fallback;
    return Math.max(0, minutes * 60 + seconds);
  }

  function safeGetLocalStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeSetLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  const legacyTemplates = {
    Anton: {
      Push: [
        {
          name: 'Bench Press',
          sets: [
            { reps: 8, weight: 80 },
            { reps: 8, weight: 80 },
            { reps: 6, weight: 85 }
          ]
        },
        {
          name: 'Overhead Press',
          sets: [
            { reps: 8, weight: 40 },
            { reps: 8, weight: 40 },
            { reps: 6, weight: 45 }
          ]
        },
        {
          name: 'Triceps Pushdown',
          sets: [
            { reps: 12, weight: 25 },
            { reps: 12, weight: 25 },
            { reps: 10, weight: 30 }
          ]
        }
      ],
      Pull: [
        {
          name: 'Pull-Up',
          sets: [
            { reps: 6, weight: 'BW' },
            { reps: 6, weight: 'BW' },
            { reps: 5, weight: 'BW' }
          ]
        },
        {
          name: 'Barbell Row',
          sets: [
            { reps: 10, weight: 60 },
            { reps: 10, weight: 60 },
            { reps: 8, weight: 65 }
          ]
        },
        {
          name: 'Biceps Curl',
          sets: [
            { reps: 12, weight: 12 },
            { reps: 12, weight: 12 },
            { reps: 10, weight: 14 }
          ]
        }
      ],
      Legs: [
        {
          name: 'Squat',
          sets: [
            { reps: 8, weight: 90 },
            { reps: 8, weight: 90 },
            { reps: 6, weight: 100 }
          ]
        },
        {
          name: 'Romanian Deadlift',
          sets: [
            { reps: 10, weight: 70 },
            { reps: 10, weight: 70 },
            { reps: 8, weight: 75 }
          ]
        },
        {
          name: 'Calf Raise',
          sets: [
            { reps: 15, weight: 40 },
            { reps: 15, weight: 40 },
            { reps: 15, weight: 40 }
          ]
        }
      ]
    },
    August: {
      'Full Body': [
        {
          name: 'Front Squat',
          sets: [
            { reps: 6, weight: 70 },
            { reps: 6, weight: 70 },
            { reps: 6, weight: 70 }
          ]
        },
        {
          name: 'Bench Press',
          sets: [
            { reps: 6, weight: 75 },
            { reps: 6, weight: 75 },
            { reps: 6, weight: 75 }
          ]
        },
        {
          name: 'Barbell Row',
          sets: [
            { reps: 8, weight: 55 },
            { reps: 8, weight: 55 },
            { reps: 8, weight: 55 }
          ]
        },
        {
          name: 'Overhead Press',
          sets: [
            { reps: 8, weight: 35 },
            { reps: 8, weight: 35 },
            { reps: 8, weight: 35 }
          ]
        },
        {
          name: 'Romanian Deadlift',
          sets: [
            { reps: 8, weight: 65 },
            { reps: 8, weight: 65 },
            { reps: 8, weight: 65 }
          ]
        }
      ],
      'Upper Focus': [
        {
          name: 'Incline Bench Press',
          sets: [
            { reps: 8, weight: 60 },
            { reps: 8, weight: 60 },
            { reps: 8, weight: 60 }
          ]
        },
        {
          name: 'Weighted Pull-Up',
          sets: [
            { reps: 5, weight: 10 },
            { reps: 5, weight: 10 },
            { reps: 5, weight: 10 }
          ]
        },
        {
          name: 'Dumbbell Shoulder Press',
          sets: [
            { reps: 10, weight: 20 },
            { reps: 10, weight: 20 },
            { reps: 10, weight: 20 }
          ]
        },
        {
          name: 'Cable Row',
          sets: [
            { reps: 12, weight: 35 },
            { reps: 12, weight: 35 },
            { reps: 12, weight: 35 }
          ]
        }
      ],
      'Lower Focus': [
        {
          name: 'Back Squat',
          sets: [
            { reps: 5, weight: 100 },
            { reps: 5, weight: 100 },
            { reps: 5, weight: 100 }
          ]
        },
        {
          name: 'Deadlift',
          sets: [
            { reps: 3, weight: 130 },
            { reps: 3, weight: 130 },
            { reps: 3, weight: 130 }
          ]
        },
        {
          name: 'Leg Press',
          sets: [
            { reps: 12, weight: 160 },
            { reps: 12, weight: 160 },
            { reps: 12, weight: 160 }
          ]
        },
        {
          name: 'Calf Raise',
          sets: [
            { reps: 15, weight: 45 },
            { reps: 15, weight: 45 },
            { reps: 15, weight: 45 }
          ]
        }
      ]
    }
  };

  function createSet({ reps = DEFAULT_SET_REPS, weight = '' } = {}) {
    return { id: createId(), reps, weight };
  }

  function createExercise({ name = 'New exercise', setCount = 3 } = {}) {
    const sets = Array.from({ length: Math.max(1, setCount) }, () => createSet());
    return { id: createId(), name, sets };
  }

  function createSingleBlock() {
    return {
      id: createId(),
      type: 'single',
      restSec: DEFAULT_REST_SEC,
      exercise: createExercise()
    };
  }

  function createGroupBlock() {
    const first = createExercise({ name: 'Exercise A' });
    const second = createExercise({ name: 'Exercise B' });
    return {
      id: createId(),
      type: 'group',
      restSec: DEFAULT_REST_SEC,
      exercises: [first, second]
    };
  }

  function groupLabel(exerciseCount) {
    if (exerciseCount <= 1) return 'Group';
    if (exerciseCount === 2) return 'Superset';
    if (exerciseCount === 3) return 'Tri-set';
    return 'Circuit';
  }

  function groupRounds(block) {
    const lengths = block.exercises.map(ex => ex.sets.length);
    return Math.max(1, ...lengths);
  }

  function normalizeStore(maybeStore) {
    const store =
      maybeStore && typeof maybeStore === 'object'
        ? maybeStore
        : { version: 1, templatesByUser: {} };

    if (!store.templatesByUser || typeof store.templatesByUser !== 'object') {
      store.templatesByUser = {};
    }
    store.version = 1;

    Object.keys(store.templatesByUser).forEach(user => {
      const templates = store.templatesByUser[user];
      if (!Array.isArray(templates)) {
        store.templatesByUser[user] = [];
        return;
      }
      templates.forEach(template => {
        if (!template.id) template.id = createId();
        if (!template.name) template.name = 'Untitled';
        if (!Array.isArray(template.blocks)) template.blocks = [];
        template.blocks.forEach(block => {
          if (!block.id) block.id = createId();
          if (block.type === 'group') {
            if (!Array.isArray(block.exercises)) block.exercises = [];
            block.restSec = parseDuration(block.restSec, DEFAULT_REST_SEC);
            block.exercises.forEach(ex => {
              if (!ex.id) ex.id = createId();
              if (!ex.name) ex.name = 'Exercise';
              if (!Array.isArray(ex.sets)) ex.sets = [];
              ex.sets.forEach(set => {
                if (!set.id) set.id = createId();
                if ('restSec' in set) delete set.restSec;
              });
            });
          } else {
            block.type = 'single';
            if (!block.exercise) block.exercise = createExercise();
            if (!block.exercise.id) block.exercise.id = createId();
            if (!block.exercise.name) block.exercise.name = 'Exercise';
            if (!Array.isArray(block.exercise.sets)) block.exercise.sets = [];
            const legacyRest =
              block.restSec ??
              block.exercise.restSec ??
              block.exercise.sets?.[0]?.restSec ??
              DEFAULT_REST_SEC;
            block.restSec = parseDuration(legacyRest, DEFAULT_REST_SEC);
            if ('restSec' in block.exercise) delete block.exercise.restSec;
            block.exercise.sets.forEach(set => {
              if (!set.id) set.id = createId();
              if ('restSec' in set) delete set.restSec;
            });
          }
        });
      });
    });

    return store;
  }

  function buildDefaultStore() {
    const templatesByUser = {};
    Object.keys(legacyTemplates).forEach(user => {
      const legacyUserTemplates = legacyTemplates[user];
      templatesByUser[user] = Object.keys(legacyUserTemplates).map(templateName => {
        const blocks = legacyUserTemplates[templateName].map(exercise => ({
          id: createId(),
          type: 'single',
          restSec: DEFAULT_REST_SEC,
          exercise: {
            id: createId(),
            name: exercise.name,
            sets: (exercise.sets || []).map(set => ({
              id: createId(),
              reps: set.reps ?? DEFAULT_SET_REPS,
              weight: set.weight ?? ''
            }))
          }
        }));
        return { id: createId(), name: templateName, blocks, updatedAt: Date.now() };
      });
    });
    return normalizeStore({ version: 1, templatesByUser });
  }

  function loadStore() {
    const raw = safeGetLocalStorage(STORAGE_KEY);
    if (!raw) {
      const fresh = buildDefaultStore();
      safeSetLocalStorage(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }

    try {
      const parsed = JSON.parse(raw);
      return normalizeStore(parsed);
    } catch {
      const fresh = buildDefaultStore();
      safeSetLocalStorage(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
  }

  function saveStore(store) {
    safeSetLocalStorage(STORAGE_KEY, JSON.stringify(store));
  }

  const state = {
    selectedUser: null,
    store: loadStore(),
    editingTemplateId: null,
    editingTemplate: null,
    activeWorkout: null,
    ui: {
      openSingleBlockId: null,
      openGroupSettingsBlockId: null,
      openGroupExerciseByBlockId: {}
    },
    rest: {
      remaining: DEFAULT_REST_SEC,
      timerId: null,
      isRunning: false
    }
  };

  const screenUser = document.getElementById('screen-user');
  const screenWorkouts = document.getElementById('screen-workouts');
  const screenTemplate = document.getElementById('screen-template');
  const screenActive = document.getElementById('screen-active');

  const userCards = Array.from(document.querySelectorAll('.user-card'));
  const userStartButton = document.getElementById('userStartButton');
  const backToUserButton = document.getElementById('backToUser');

  const workoutTemplateGrid = document.getElementById('workoutTemplateGrid');
  const workoutUserTitle = document.getElementById('workoutUserTitle');
  const workoutUserSubtitle = document.getElementById('workoutUserSubtitle');

  const backToTemplatesButton = document.getElementById('backToTemplates');
  const templateTitle = document.getElementById('templateTitle');
  const templateNameInput = document.getElementById('templateNameInput');
  const blockList = document.getElementById('blockList');
  const addSingleBlockButton = document.getElementById('addSingleBlock');
  const addGroupBlockButton = document.getElementById('addGroupBlock');
  const saveTemplateButton = document.getElementById('saveTemplateButton');
  const templateStartButton = document.getElementById('templateStartButton');
  const deleteTemplateButton = document.getElementById('deleteTemplateButton');

  const activeWorkoutTitle = document.getElementById('activeWorkoutTitle');
  const activeWorkoutSubtitle = document.getElementById('activeWorkoutSubtitle');
  const exerciseGrid = document.getElementById('exerciseGrid');
  const restTimerButton = document.getElementById('restTimerButton');
  const restTimerValue = document.getElementById('restTimerValue');
  const finishWorkoutButton = document.getElementById('finishWorkoutButton');
  const resetAppButton = document.getElementById('resetAppButton');

  function showScreen(target) {
    [screenUser, screenWorkouts, screenTemplate, screenActive].forEach(screen => {
      if (screen === target) {
        screen.classList.add('screen--active');
      } else {
        screen.classList.remove('screen--active');
      }
    });
  }

  function getUserTemplates(user) {
    return state.store.templatesByUser[user] || [];
  }

  function setUserTemplates(user, templates) {
    state.store.templatesByUser[user] = templates;
    saveStore(state.store);
  }

  function findTemplate(user, templateId) {
    return getUserTemplates(user).find(t => t.id === templateId) || null;
  }

  function templateStats(template) {
    let exerciseCount = 0;
    let setCount = 0;
    template.blocks.forEach(block => {
      if (block.type === 'group') {
        exerciseCount += block.exercises.length;
        block.exercises.forEach(ex => {
          setCount += ex.sets.length;
        });
        return;
      }
      exerciseCount += 1;
      setCount += block.exercise.sets.length;
    });
    return { exerciseCount, setCount };
  }

  function normalizeText(value) {
    if (value == null) return '';
    return String(value).trim();
  }

  function summarizeExercise(exercise) {
    const sets = Array.isArray(exercise?.sets) ? exercise.sets : [];
    const setCount = sets.length;

    const repValues = sets
      .map(set => set.reps)
      .filter(value => typeof value === 'number' && !Number.isNaN(value));
    const weightValues = sets.map(set => normalizeText(set.weight)).filter(Boolean);

    let repText = '';
    if (repValues.length) {
      const first = repValues[0];
      repText = repValues.every(v => v === first) ? `${first} reps` : 'reps vary';
    }

    let weightText = '';
    if (weightValues.length) {
      const first = weightValues[0];
      weightText = weightValues.every(v => v === first) ? first : 'weight vary';
    }

    const parts = [`${setCount} sets`];
    if (repText) parts.push(repText);
    if (weightText) parts.push(weightText);
    return parts.join(' \u00b7 ');
  }

  function renderTemplatesScreen() {
    if (!state.selectedUser) return;
    workoutUserTitle.textContent = `${state.selectedUser}'s templates`;
    workoutUserSubtitle.textContent = 'Tap a template to edit and start a workout.';

    workoutTemplateGrid.innerHTML = '';

    const templates = getUserTemplates(state.selectedUser);

    const newCard = document.createElement('button');
    newCard.type = 'button';
    newCard.className = 'workout-card workout-card--new';
    newCard.innerHTML =
      '<div class="workout-card-main"><p class="workout-card-title">+ New template</p><p class="workout-card-meta">Build a custom plan</p></div>';
    newCard.addEventListener('click', () => {
      const template = { id: createId(), name: 'New template', blocks: [], updatedAt: Date.now() };
      setUserTemplates(state.selectedUser, [template, ...templates]);
      openTemplateEditor(template.id);
    });
    workoutTemplateGrid.appendChild(newCard);

    templates.forEach(template => {
      const { exerciseCount, setCount } = templateStats(template);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'workout-card workout-card--template';
      card.dataset.templateId = template.id;
      card.innerHTML = `<div class="workout-card-main"><p class="workout-card-title">${template.name}</p><p class="workout-card-meta">${exerciseCount} exercises \u00b7 ${setCount} sets</p></div>`;

      const actions = document.createElement('div');
      actions.className = 'workout-card-actions';

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'card-action card-action--danger';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', event => {
        event.stopPropagation();
        if (!confirm(`Delete "${template.name}"?`)) return;
        const next = getUserTemplates(state.selectedUser).filter(t => t.id !== template.id);
        setUserTemplates(state.selectedUser, next);
        renderTemplatesScreen();
      });

      actions.appendChild(deleteButton);
      card.appendChild(actions);

      card.addEventListener('click', () => {
        openTemplateEditor(template.id);
      });
      workoutTemplateGrid.appendChild(card);
    });
  }

  function openTemplateEditor(templateId) {
    if (!state.selectedUser) return;
    const template = findTemplate(state.selectedUser, templateId);
    if (!template) return;

    state.editingTemplateId = templateId;
    state.editingTemplate = deepClone(template);
    state.ui.openSingleBlockId = null;
    state.ui.openGroupSettingsBlockId = null;
    state.ui.openGroupExerciseByBlockId = {};
    templateTitle.textContent = template.name;
    templateNameInput.value = template.name;
    renderTemplateEditor();
    showScreen(screenTemplate);
  }

  function commitEditingTemplate() {
    if (!state.selectedUser || !state.editingTemplateId || !state.editingTemplate) return;
    const templates = getUserTemplates(state.selectedUser);
    const next = templates.map(t => (t.id === state.editingTemplateId ? state.editingTemplate : t));
    const exists = next.some(t => t.id === state.editingTemplateId);
    const finalList = exists ? next : [state.editingTemplate, ...templates];
    state.editingTemplate.updatedAt = Date.now();
    setUserTemplates(state.selectedUser, finalList);
  }

  function ensureSortable(container, { itemSelector, handleSelector, onOrderChange }) {
    if (!container || container.dataset.sortable === 'true') return;
    container.dataset.sortable = 'true';

    let dragged = null;
    let placeholder = null;
    let pointerOffsetY = 0;

    function cleanup() {
      if (!dragged) return;
      dragged.classList.remove('is-dragging');
      dragged.style.position = '';
      dragged.style.top = '';
      dragged.style.left = '';
      dragged.style.width = '';
      dragged.style.zIndex = '';
      dragged.style.pointerEvents = '';
      dragged = null;
      pointerOffsetY = 0;
      if (placeholder) {
        placeholder.remove();
        placeholder = null;
      }
    }

    container.addEventListener('pointerdown', event => {
      const handle = event.target.closest(handleSelector);
      if (!handle) return;
      const item = handle.closest(itemSelector);
      if (!item || !container.contains(item)) return;

      event.preventDefault();
      dragged = item;
      const rect = item.getBoundingClientRect();
      pointerOffsetY = event.clientY - rect.top;

      placeholder = document.createElement('div');
      placeholder.className = 'drag-placeholder';
      placeholder.style.height = `${rect.height}px`;

      item.after(placeholder);

      item.classList.add('is-dragging');
      item.style.position = 'fixed';
      item.style.top = `${rect.top}px`;
      item.style.left = `${rect.left}px`;
      item.style.width = `${rect.width}px`;
      item.style.zIndex = '2000';
      item.style.pointerEvents = 'none';

      document.body.appendChild(item);
      item.setPointerCapture(event.pointerId);

      function onMove(moveEvent) {
        if (!dragged || !placeholder) return;
        const top = moveEvent.clientY - pointerOffsetY;
        dragged.style.top = `${top}px`;

        const siblings = Array.from(container.querySelectorAll(itemSelector)).filter(
          el => el !== placeholder
        );

        const placeholderCenterY = moveEvent.clientY;
        const before = siblings.find(el => {
          const r = el.getBoundingClientRect();
          return placeholderCenterY < r.top + r.height / 2;
        });

        if (before) {
          container.insertBefore(placeholder, before);
        } else {
          container.appendChild(placeholder);
        }
      }

      function onUp(upEvent) {
        upEvent.preventDefault();
        if (dragged && placeholder) {
          container.insertBefore(dragged, placeholder);
          placeholder.remove();
          placeholder = null;

          dragged.classList.remove('is-dragging');
          dragged.style.position = '';
          dragged.style.top = '';
          dragged.style.left = '';
          dragged.style.width = '';
          dragged.style.zIndex = '';
          dragged.style.pointerEvents = '';

          const orderedIds = Array.from(container.querySelectorAll(itemSelector))
            .map(el => el.dataset.sortId)
            .filter(Boolean);
          onOrderChange(orderedIds);
        }

        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        cleanup();
      }

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp, { once: true });
    });
  }

  // Legacy renderer (unused) kept temporarily while iterating on the template UI.
  function renderTemplateEditorLegacy() {
    if (!state.editingTemplate) return;

    templateTitle.textContent = state.editingTemplate.name;
    blockList.innerHTML = '';

    ensureSortable(blockList, {
      itemSelector: '.block-card',
      handleSelector: '.drag-handle',
      onOrderChange: orderedIds => {
        const byId = new Map(state.editingTemplate.blocks.map(block => [block.id, block]));
        state.editingTemplate.blocks = orderedIds.map(id => byId.get(id)).filter(Boolean);
      }
    });

    if (!state.editingTemplate.blocks.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No blocks yet. Add an exercise or a superset/circuit.';
      blockList.appendChild(empty);
      return;
    }

    state.editingTemplate.blocks.forEach(block => {
      const card = document.createElement('article');
      card.className = 'block-card';
      card.dataset.sortId = block.id;

      const header = document.createElement('div');
      header.className = 'block-header';

      const handle = document.createElement('button');
      handle.type = 'button';
      handle.className = 'drag-handle';
      handle.title = 'Drag to reorder';
      handle.textContent = '↕';

      const title = document.createElement('div');
      title.className = 'block-title';

      const pill = document.createElement('span');
      pill.className = `pill ${block.type === 'group' ? 'pill--group' : 'pill--single'}`;
      pill.textContent = block.type === 'group' ? groupLabel(block.exercises.length) : 'Exercise';

      const name = document.createElement('p');
      name.className = 'block-name';
      name.textContent =
        block.type === 'group' ? `${groupRounds(block)} rounds` : `${block.exercise.sets.length} sets`;

      title.appendChild(pill);
      title.appendChild(name);

      const headerActions = document.createElement('div');
      headerActions.className = 'block-header-actions';

      const deleteBlockButton = document.createElement('button');
      deleteBlockButton.type = 'button';
      deleteBlockButton.className = 'card-action card-action--danger';
      deleteBlockButton.textContent = 'Remove';
      deleteBlockButton.addEventListener('click', () => {
        if (!confirm('Remove this block?')) return;
        state.editingTemplate.blocks = state.editingTemplate.blocks.filter(b => b.id !== block.id);
        renderTemplateEditor();
      });

      headerActions.appendChild(deleteBlockButton);

      header.appendChild(handle);
      header.appendChild(title);
      header.appendChild(headerActions);
      card.appendChild(header);

      const body = document.createElement('div');
      body.className = 'block-body';

      if (block.type === 'group') {
        const controls = document.createElement('div');
        controls.className = 'group-controls';

        const roundCount = document.createElement('div');
        roundCount.className = 'group-rounds';
        roundCount.innerHTML = `<span class="group-rounds-label">Rounds</span><span class="group-rounds-value">${groupRounds(
          block
        )}</span>`;

        const roundButtons = document.createElement('div');
        roundButtons.className = 'group-rounds-actions';

        const addRound = document.createElement('button');
        addRound.type = 'button';
        addRound.className = 'mini-button';
        addRound.textContent = '+ round';
        addRound.addEventListener('click', () => {
          block.exercises.forEach(ex => {
            const last = ex.sets[ex.sets.length - 1];
            ex.sets.push(
              createSet({
                reps: typeof last?.reps === 'number' ? last.reps : DEFAULT_SET_REPS,
                weight: last?.weight ?? ''
              })
            );
          });
          renderTemplateEditor();
        });

        const removeRound = document.createElement('button');
        removeRound.type = 'button';
        removeRound.className = 'mini-button mini-button--danger';
        removeRound.textContent = '- round';
        removeRound.addEventListener('click', () => {
          const rounds = groupRounds(block);
          block.exercises.forEach(ex => {
            if (ex.sets.length === rounds && ex.sets.length > 1) {
              ex.sets.pop();
            }
          });
          renderTemplateEditor();
        });

        roundButtons.appendChild(addRound);
        roundButtons.appendChild(removeRound);

        const restField = document.createElement('label');
        restField.className = 'inline-field';
        restField.innerHTML = `<span class="inline-field-label">Rest after round</span>`;
        const restInput = document.createElement('input');
        restInput.className = 'text-input text-input--compact';
        restInput.type = 'text';
        restInput.inputMode = 'numeric';
        restInput.value = formatDuration(block.restSec ?? DEFAULT_REST_SEC);
        restInput.addEventListener('blur', () => {
          block.restSec = parseDuration(restInput.value, DEFAULT_REST_SEC);
          restInput.value = formatDuration(block.restSec);
        });
        restField.appendChild(restInput);

        const addExerciseToGroup = document.createElement('button');
        addExerciseToGroup.type = 'button';
        addExerciseToGroup.className = 'mini-button';
        addExerciseToGroup.textContent = '+ exercise';
        addExerciseToGroup.addEventListener('click', () => {
          const rounds = groupRounds(block);
          const ex = createExercise({ name: `Exercise ${block.exercises.length + 1}` });
          while (ex.sets.length < rounds) ex.sets.push(createSet());
          block.exercises.push(ex);
          renderTemplateEditor();
        });

        controls.appendChild(roundCount);
        controls.appendChild(roundButtons);
        controls.appendChild(restField);
        controls.appendChild(addExerciseToGroup);
        body.appendChild(controls);

        const exerciseList = document.createElement('div');
        exerciseList.className = 'group-exercise-list';
        exerciseList.dataset.groupBlockId = block.id;

        ensureSortable(exerciseList, {
          itemSelector: '.group-exercise-card',
          handleSelector: '.drag-handle',
          onOrderChange: orderedIds => {
            const byId = new Map(block.exercises.map(ex => [ex.id, ex]));
            block.exercises = orderedIds.map(id => byId.get(id)).filter(Boolean);
          }
        });

        block.exercises.forEach(exercise => {
          const exCard = document.createElement('div');
          exCard.className = 'group-exercise-card';
          exCard.dataset.sortId = exercise.id;

          const exHeader = document.createElement('div');
          exHeader.className = 'group-exercise-header';

          const exHandle = document.createElement('button');
          exHandle.type = 'button';
          exHandle.className = 'drag-handle drag-handle--small';
          exHandle.title = 'Drag to reorder';
          exHandle.textContent = '↕';

          const exNameInput = document.createElement('input');
          exNameInput.className = 'text-input text-input--compact';
          exNameInput.type = 'text';
          exNameInput.value = exercise.name;
          exNameInput.addEventListener('input', () => {
            exercise.name = exNameInput.value;
          });

          const exButtons = document.createElement('div');
          exButtons.className = 'group-exercise-actions';

          const exAddSet = document.createElement('button');
          exAddSet.type = 'button';
          exAddSet.className = 'mini-button';
          exAddSet.textContent = '+ set';
          exAddSet.addEventListener('click', () => {
            const last = exercise.sets[exercise.sets.length - 1];
            exercise.sets.push(
              createSet({
                reps: typeof last?.reps === 'number' ? last.reps : DEFAULT_SET_REPS,
                weight: last?.weight ?? ''
              })
            );
            renderTemplateEditor();
          });

          const exRemoveSet = document.createElement('button');
          exRemoveSet.type = 'button';
          exRemoveSet.className = 'mini-button mini-button--danger';
          exRemoveSet.textContent = '- set';
          exRemoveSet.addEventListener('click', () => {
            if (exercise.sets.length <= 1) return;
            exercise.sets.pop();
            renderTemplateEditor();
          });

          const exDelete = document.createElement('button');
          exDelete.type = 'button';
          exDelete.className = 'mini-button mini-button--danger';
          exDelete.textContent = 'Remove';
          exDelete.addEventListener('click', () => {
            if (block.exercises.length <= 2) {
              alert('Keep at least 2 exercises in a superset/circuit.');
              return;
            }
            if (!confirm(`Remove "${exercise.name}" from this group?`)) return;
            block.exercises = block.exercises.filter(ex => ex.id !== exercise.id);
            renderTemplateEditor();
          });

          exButtons.appendChild(exAddSet);
          exButtons.appendChild(exRemoveSet);
          exButtons.appendChild(exDelete);

          exHeader.appendChild(exHandle);
          exHeader.appendChild(exNameInput);
          exHeader.appendChild(exButtons);
          exCard.appendChild(exHeader);

          const setHeader = document.createElement('div');
          setHeader.className = 'set-header-row set-header-row--group';
          ['Set', 'Reps', 'Weight'].forEach(label => {
            const span = document.createElement('span');
            span.className = 'set-header-label';
            span.textContent = label;
            setHeader.appendChild(span);
          });
          exCard.appendChild(setHeader);

          const setList = document.createElement('div');
          setList.className = 'set-list';
          exercise.sets.forEach((set, setIndex) => {
            const row = document.createElement('div');
            row.className = 'set-row set-row--group';

            const indexPill = document.createElement('div');
            indexPill.className = 'set-index-pill';
            indexPill.textContent = String(setIndex + 1);

            const repsInput = document.createElement('input');
            repsInput.type = 'number';
            repsInput.min = '0';
            repsInput.inputMode = 'numeric';
            repsInput.className = 'set-input';
            repsInput.value = String(set.reps ?? DEFAULT_SET_REPS);
            repsInput.addEventListener('input', () => {
              const value = parseInt(repsInput.value, 10);
              set.reps = Number.isNaN(value) ? 0 : value;
            });

            const weightInput = document.createElement('input');
            weightInput.type = 'text';
            weightInput.className = 'set-input';
            weightInput.value = String(set.weight ?? '');
            weightInput.addEventListener('input', () => {
              set.weight = weightInput.value;
            });

            row.appendChild(indexPill);
            row.appendChild(repsInput);
            row.appendChild(weightInput);
            setList.appendChild(row);
          });
          exCard.appendChild(setList);

          exerciseList.appendChild(exCard);
        });

        body.appendChild(exerciseList);
      } else {
        const nameField = document.createElement('label');
        nameField.className = 'field';
        nameField.innerHTML = `<span class="field-label">Exercise name</span>`;
        const nameInput = document.createElement('input');
        nameInput.className = 'text-input';
        nameInput.type = 'text';
        nameInput.value = block.exercise.name;
        nameInput.addEventListener('input', () => {
          block.exercise.name = nameInput.value;
        });
        nameField.appendChild(nameInput);
        body.appendChild(nameField);

        const setControls = document.createElement('div');
        setControls.className = 'single-controls';

        const setsLabel = document.createElement('div');
        setsLabel.className = 'single-sets';
        setsLabel.innerHTML = `<span class="single-sets-label">Sets</span><span class="single-sets-value">${block.exercise.sets.length}</span>`;

        const setButtons = document.createElement('div');
        setButtons.className = 'single-sets-actions';

        const addSetButton = document.createElement('button');
        addSetButton.type = 'button';
        addSetButton.className = 'mini-button';
        addSetButton.textContent = '+ set';
        addSetButton.addEventListener('click', () => {
          const last = block.exercise.sets[block.exercise.sets.length - 1];
          block.exercise.sets.push(
            createSet({
              reps: typeof last?.reps === 'number' ? last.reps : DEFAULT_SET_REPS,
              weight: last?.weight ?? ''
            })
          );
          renderTemplateEditor();
        });

        const removeSetButton = document.createElement('button');
        removeSetButton.type = 'button';
        removeSetButton.className = 'mini-button mini-button--danger';
        removeSetButton.textContent = '- set';
        removeSetButton.addEventListener('click', () => {
          if (block.exercise.sets.length <= 1) return;
          block.exercise.sets.pop();
          renderTemplateEditor();
        });

        setButtons.appendChild(addSetButton);
        setButtons.appendChild(removeSetButton);
        setControls.appendChild(setsLabel);
        setControls.appendChild(setButtons);
        body.appendChild(setControls);

        const setHeader = document.createElement('div');
        setHeader.className = 'set-header-row set-header-row--single';
        ['Set', 'Reps', 'Weight', 'Rest'].forEach(label => {
          const span = document.createElement('span');
          span.className = 'set-header-label';
          span.textContent = label;
          setHeader.appendChild(span);
        });
        body.appendChild(setHeader);

        const setList = document.createElement('div');
        setList.className = 'set-list';
        block.exercise.sets.forEach((set, setIndex) => {
          const row = document.createElement('div');
          row.className = 'set-row set-row--single';

          const indexPill = document.createElement('div');
          indexPill.className = 'set-index-pill';
          indexPill.textContent = String(setIndex + 1);

          const repsInput = document.createElement('input');
          repsInput.type = 'number';
          repsInput.min = '0';
          repsInput.inputMode = 'numeric';
          repsInput.className = 'set-input';
          repsInput.value = String(set.reps ?? DEFAULT_SET_REPS);
          repsInput.addEventListener('input', () => {
            const value = parseInt(repsInput.value, 10);
            set.reps = Number.isNaN(value) ? 0 : value;
          });

          const weightInput = document.createElement('input');
          weightInput.type = 'text';
          weightInput.className = 'set-input';
          weightInput.value = String(set.weight ?? '');
          weightInput.addEventListener('input', () => {
            set.weight = weightInput.value;
          });

          const restInput = document.createElement('input');
          restInput.type = 'text';
          restInput.inputMode = 'numeric';
          restInput.className = 'set-input';
          restInput.value = formatDuration(set.restSec ?? DEFAULT_REST_SEC);
          restInput.addEventListener('blur', () => {
            set.restSec = parseDuration(restInput.value, DEFAULT_REST_SEC);
            restInput.value = formatDuration(set.restSec);
          });

          row.appendChild(indexPill);
          row.appendChild(repsInput);
          row.appendChild(weightInput);
          row.appendChild(restInput);
          setList.appendChild(row);
        });
        body.appendChild(setList);
      }

      card.appendChild(body);
      blockList.appendChild(card);
    });
  }

  function renderTemplateEditor() {
    if (!state.editingTemplate) return;

    templateTitle.textContent = state.editingTemplate.name;
    blockList.innerHTML = '';

    ensureSortable(blockList, {
      itemSelector: '.block-card',
      handleSelector: '.drag-handle',
      onOrderChange: orderedIds => {
        const byId = new Map(state.editingTemplate.blocks.map(block => [block.id, block]));
        state.editingTemplate.blocks = orderedIds.map(id => byId.get(id)).filter(Boolean);
      }
    });

    if (!state.editingTemplate.blocks.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No blocks yet. Add an exercise or a superset/circuit.';
      blockList.appendChild(empty);
      return;
    }

    state.editingTemplate.blocks.forEach(block => {
      const card = document.createElement('article');
      card.className = `block-card block-card--list ${
        block.type === 'group' ? 'block-card--group' : 'block-card--single'
      }`;
      card.dataset.sortId = block.id;

      const header = document.createElement('div');
      header.className = 'block-row';

      const handle = document.createElement('button');
      handle.type = 'button';
      handle.className = 'drag-handle';
      handle.title = 'Drag to reorder';
      handle.textContent = '↕';

      const main = document.createElement('div');
      main.className = 'row-main';

      const title = document.createElement('p');
      title.className = 'row-title';

      const meta = document.createElement('p');
      meta.className = 'row-meta';

      const actions = document.createElement('div');
      actions.className = 'row-actions';

      const chevron = document.createElement('span');
      chevron.className = 'row-chevron';
      chevron.textContent = '›';

      const menuButton = document.createElement('button');
      menuButton.type = 'button';
      menuButton.className = 'icon-button';
      menuButton.textContent = '⋯';
      menuButton.title = 'More';
      menuButton.addEventListener('click', event => {
        event.stopPropagation();
        if (!confirm('Remove this block?')) return;
        state.editingTemplate.blocks = state.editingTemplate.blocks.filter(b => b.id !== block.id);
        if (state.ui.openSingleBlockId === block.id) state.ui.openSingleBlockId = null;
        if (state.ui.openGroupSettingsBlockId === block.id) state.ui.openGroupSettingsBlockId = null;
        if (state.ui.openGroupExerciseByBlockId[block.id]) delete state.ui.openGroupExerciseByBlockId[block.id];
        renderTemplateEditor();
      });

      actions.appendChild(chevron);
      actions.appendChild(menuButton);

      function refreshHeader() {
        if (block.type === 'group') {
          title.textContent = `${groupLabel(block.exercises.length)} \u00b7 ${groupRounds(block)} rounds`;
          meta.textContent = `Rest ${formatDuration(block.restSec ?? DEFAULT_REST_SEC)}`;
          chevron.classList.toggle(
            'row-chevron--open',
            state.ui.openGroupSettingsBlockId === block.id
          );
          return;
        }
        title.textContent = block.exercise?.name || 'Exercise';
        meta.textContent = `${summarizeExercise(block.exercise)} \u00b7 Rest ${formatDuration(
          block.restSec ?? DEFAULT_REST_SEC
        )}`;
        chevron.classList.toggle(
          'row-chevron--open',
          state.ui.openSingleBlockId === block.id
        );
      }

      refreshHeader();

      main.appendChild(title);
      main.appendChild(meta);

      header.appendChild(handle);
      header.appendChild(main);
      header.appendChild(actions);
      card.appendChild(header);

      if (block.type === 'group') {
        header.addEventListener('click', event => {
          if (event.target.closest('button')) return;
          state.ui.openGroupSettingsBlockId =
            state.ui.openGroupSettingsBlockId === block.id ? null : block.id;
          renderTemplateEditor();
        });

        const body = document.createElement('div');
        body.className = 'block-body block-body--list';

        const settingsOpen = state.ui.openGroupSettingsBlockId === block.id;
        if (settingsOpen) {
          const controls = document.createElement('div');
          controls.className = 'group-controls';

          const roundCount = document.createElement('div');
          roundCount.className = 'group-rounds';
          roundCount.innerHTML = `<span class="group-rounds-label">Rounds</span><span class="group-rounds-value">${groupRounds(
            block
          )}</span>`;

          const roundButtons = document.createElement('div');
          roundButtons.className = 'group-rounds-actions';

          const addRound = document.createElement('button');
          addRound.type = 'button';
          addRound.className = 'mini-button';
          addRound.textContent = '+ round';
          addRound.addEventListener('click', () => {
            block.exercises.forEach(ex => {
              const last = ex.sets[ex.sets.length - 1];
              ex.sets.push(
                createSet({
                  reps: typeof last?.reps === 'number' ? last.reps : DEFAULT_SET_REPS,
                  weight: last?.weight ?? ''
                })
              );
            });
            renderTemplateEditor();
          });

          const removeRound = document.createElement('button');
          removeRound.type = 'button';
          removeRound.className = 'mini-button mini-button--danger';
          removeRound.textContent = '- round';
          removeRound.addEventListener('click', () => {
            const rounds = groupRounds(block);
            block.exercises.forEach(ex => {
              if (ex.sets.length === rounds && ex.sets.length > 1) {
                ex.sets.pop();
              }
            });
            renderTemplateEditor();
          });

          roundButtons.appendChild(addRound);
          roundButtons.appendChild(removeRound);

          const restField = document.createElement('label');
          restField.className = 'inline-field';
          restField.innerHTML = `<span class="inline-field-label">Rest after round</span>`;
          const restInput = document.createElement('input');
          restInput.className = 'text-input text-input--compact';
          restInput.type = 'text';
          restInput.inputMode = 'numeric';
          restInput.value = formatDuration(block.restSec ?? DEFAULT_REST_SEC);
          restInput.addEventListener('blur', () => {
            block.restSec = parseDuration(restInput.value, DEFAULT_REST_SEC);
            restInput.value = formatDuration(block.restSec);
            refreshHeader();
          });
          restField.appendChild(restInput);

          const addExerciseToGroup = document.createElement('button');
          addExerciseToGroup.type = 'button';
          addExerciseToGroup.className = 'mini-button';
          addExerciseToGroup.textContent = '+ exercise';
          addExerciseToGroup.addEventListener('click', () => {
            const rounds = groupRounds(block);
            const ex = createExercise({ name: `Exercise ${block.exercises.length + 1}` });
            while (ex.sets.length < rounds) ex.sets.push(createSet());
            block.exercises.push(ex);
            state.ui.openGroupExerciseByBlockId[block.id] = ex.id;
            renderTemplateEditor();
          });

          controls.appendChild(roundCount);
          controls.appendChild(roundButtons);
          controls.appendChild(restField);
          controls.appendChild(addExerciseToGroup);
          body.appendChild(controls);
        }

        const exerciseList = document.createElement('div');
        exerciseList.className = 'group-exercise-list group-exercise-list--rows';
        exerciseList.dataset.groupBlockId = block.id;

        ensureSortable(exerciseList, {
          itemSelector: '.group-exercise-item',
          handleSelector: '.drag-handle',
          onOrderChange: orderedIds => {
            const byId = new Map(block.exercises.map(ex => [ex.id, ex]));
            block.exercises = orderedIds.map(id => byId.get(id)).filter(Boolean);
          }
        });

        block.exercises.forEach(exercise => {
          const item = document.createElement('div');
          item.className = 'group-exercise-item';
          item.dataset.sortId = exercise.id;

          const row = document.createElement('div');
          row.className = 'exercise-row';

          const exHandle = document.createElement('button');
          exHandle.type = 'button';
          exHandle.className = 'drag-handle drag-handle--small';
          exHandle.title = 'Drag to reorder';
          exHandle.textContent = '↕';

          const rowMain = document.createElement('div');
          rowMain.className = 'row-main row-main--dense';

          const rowTitle = document.createElement('p');
          rowTitle.className = 'row-title row-title--dense';
          rowTitle.textContent = exercise.name || 'Exercise';

          const rowMeta = document.createElement('p');
          rowMeta.className = 'row-meta row-meta--dense';
          rowMeta.textContent = summarizeExercise(exercise);

          rowMain.appendChild(rowTitle);
          rowMain.appendChild(rowMeta);

          const rowActions = document.createElement('div');
          rowActions.className = 'row-actions';

          const isOpen = state.ui.openGroupExerciseByBlockId[block.id] === exercise.id;
          const exChevron = document.createElement('span');
          exChevron.className = `row-chevron row-chevron--small ${isOpen ? 'row-chevron--open' : ''}`;
          exChevron.textContent = '›';
          rowActions.appendChild(exChevron);

          row.appendChild(exHandle);
          row.appendChild(rowMain);
          row.appendChild(rowActions);

          row.addEventListener('click', event => {
            if (event.target.closest('button')) return;
            state.ui.openGroupExerciseByBlockId[block.id] = isOpen ? null : exercise.id;
            renderTemplateEditor();
          });

          item.appendChild(row);

          if (isOpen) {
            const details = document.createElement('div');
            details.className = 'exercise-details';

            const nameInput = document.createElement('input');
            nameInput.className = 'text-input text-input--compact';
            nameInput.type = 'text';
            nameInput.placeholder = 'Exercise name';
            nameInput.value = exercise.name;
            nameInput.addEventListener('input', () => {
              exercise.name = nameInput.value;
              rowTitle.textContent = exercise.name || 'Exercise';
            });
            details.appendChild(nameInput);

            const controls = document.createElement('div');
            controls.className = 'single-controls';

            const setsLabel = document.createElement('div');
            setsLabel.className = 'single-sets';
            setsLabel.innerHTML = `<span class="single-sets-label">Sets</span><span class="single-sets-value">${exercise.sets.length}</span>`;

            const setButtons = document.createElement('div');
            setButtons.className = 'single-sets-actions';

            const addSet = document.createElement('button');
            addSet.type = 'button';
            addSet.className = 'mini-button';
            addSet.textContent = '+ set';
            addSet.addEventListener('click', () => {
              const last = exercise.sets[exercise.sets.length - 1];
              exercise.sets.push(
                createSet({
                  reps: typeof last?.reps === 'number' ? last.reps : DEFAULT_SET_REPS,
                  weight: last?.weight ?? ''
                })
              );
              renderTemplateEditor();
            });

            const removeSet = document.createElement('button');
            removeSet.type = 'button';
            removeSet.className = 'mini-button mini-button--danger';
            removeSet.textContent = '- set';
            removeSet.addEventListener('click', () => {
              if (exercise.sets.length <= 1) return;
              exercise.sets.pop();
              renderTemplateEditor();
            });

            setButtons.appendChild(addSet);
            setButtons.appendChild(removeSet);
            controls.appendChild(setsLabel);
            controls.appendChild(setButtons);
            details.appendChild(controls);

            const setHeader = document.createElement('div');
            setHeader.className = 'set-header-row';
            ['Set', 'Reps', 'Weight'].forEach(label => {
              const span = document.createElement('span');
              span.className = 'set-header-label';
              span.textContent = label;
              setHeader.appendChild(span);
            });
            details.appendChild(setHeader);

            const setList = document.createElement('div');
            setList.className = 'set-list';

            exercise.sets.forEach((set, setIndex) => {
              const setRow = document.createElement('div');
              setRow.className = 'set-row';

              const indexPill = document.createElement('div');
              indexPill.className = 'set-index-pill';
              indexPill.textContent = String(setIndex + 1);

              const repsInput = document.createElement('input');
              repsInput.type = 'number';
              repsInput.min = '0';
              repsInput.inputMode = 'numeric';
              repsInput.className = 'set-input';
              repsInput.value = String(set.reps ?? DEFAULT_SET_REPS);
              repsInput.addEventListener('input', () => {
                const value = parseInt(repsInput.value, 10);
                set.reps = Number.isNaN(value) ? 0 : value;
                rowMeta.textContent = summarizeExercise(exercise);
              });

              const weightInput = document.createElement('input');
              weightInput.type = 'text';
              weightInput.className = 'set-input';
              weightInput.value = String(set.weight ?? '');
              weightInput.addEventListener('input', () => {
                set.weight = weightInput.value;
                rowMeta.textContent = summarizeExercise(exercise);
              });

              setRow.appendChild(indexPill);
              setRow.appendChild(repsInput);
              setRow.appendChild(weightInput);
              setList.appendChild(setRow);
            });

            details.appendChild(setList);

            const removeExerciseButton = document.createElement('button');
            removeExerciseButton.type = 'button';
            removeExerciseButton.className = 'mini-button mini-button--danger';
            removeExerciseButton.textContent = 'Remove exercise';
            removeExerciseButton.addEventListener('click', () => {
              if (block.exercises.length <= 2) {
                alert('Keep at least 2 exercises in a superset/circuit.');
                return;
              }
              if (!confirm(`Remove "${exercise.name}" from this group?`)) return;
              block.exercises = block.exercises.filter(ex => ex.id !== exercise.id);
              if (state.ui.openGroupExerciseByBlockId[block.id] === exercise.id) {
                state.ui.openGroupExerciseByBlockId[block.id] = null;
              }
              renderTemplateEditor();
            });
            details.appendChild(removeExerciseButton);

            item.appendChild(details);
          }

          exerciseList.appendChild(item);
        });

        body.appendChild(exerciseList);
        card.appendChild(body);
      } else {
        header.addEventListener('click', event => {
          if (event.target.closest('button')) return;
          state.ui.openSingleBlockId =
            state.ui.openSingleBlockId === block.id ? null : block.id;
          renderTemplateEditor();
        });

        if (state.ui.openSingleBlockId === block.id) {
          const body = document.createElement('div');
          body.className = 'block-body block-body--editor';

          const nameInput = document.createElement('input');
          nameInput.className = 'text-input';
          nameInput.type = 'text';
          nameInput.placeholder = 'Exercise name';
          nameInput.value = block.exercise.name;
          nameInput.addEventListener('input', () => {
            block.exercise.name = nameInput.value;
            refreshHeader();
          });
          body.appendChild(nameInput);

          const controls = document.createElement('div');
          controls.className = 'single-controls';

          const setsLabel = document.createElement('div');
          setsLabel.className = 'single-sets';
          setsLabel.innerHTML = `<span class="single-sets-label">Sets</span><span class="single-sets-value">${block.exercise.sets.length}</span>`;

          const restField = document.createElement('label');
          restField.className = 'inline-field';
          restField.innerHTML = `<span class="inline-field-label">Rest after set</span>`;
          const restInput = document.createElement('input');
          restInput.className = 'text-input text-input--compact';
          restInput.type = 'text';
          restInput.inputMode = 'numeric';
          restInput.value = formatDuration(block.restSec ?? DEFAULT_REST_SEC);
          restInput.addEventListener('blur', () => {
            block.restSec = parseDuration(restInput.value, DEFAULT_REST_SEC);
            restInput.value = formatDuration(block.restSec);
            refreshHeader();
          });
          restField.appendChild(restInput);

          const setButtons = document.createElement('div');
          setButtons.className = 'single-sets-actions';

          const addSet = document.createElement('button');
          addSet.type = 'button';
          addSet.className = 'mini-button';
          addSet.textContent = '+ set';
          addSet.addEventListener('click', () => {
            const last = block.exercise.sets[block.exercise.sets.length - 1];
            block.exercise.sets.push(
              createSet({
                reps: typeof last?.reps === 'number' ? last.reps : DEFAULT_SET_REPS,
                weight: last?.weight ?? ''
              })
            );
            renderTemplateEditor();
          });

          const removeSet = document.createElement('button');
          removeSet.type = 'button';
          removeSet.className = 'mini-button mini-button--danger';
          removeSet.textContent = '- set';
          removeSet.addEventListener('click', () => {
            if (block.exercise.sets.length <= 1) return;
            block.exercise.sets.pop();
            renderTemplateEditor();
          });

          setButtons.appendChild(addSet);
          setButtons.appendChild(removeSet);

          controls.appendChild(setsLabel);
          controls.appendChild(restField);
          controls.appendChild(setButtons);
          body.appendChild(controls);

          const setHeader = document.createElement('div');
          setHeader.className = 'set-header-row';
          ['Set', 'Reps', 'Weight'].forEach(label => {
            const span = document.createElement('span');
            span.className = 'set-header-label';
            span.textContent = label;
            setHeader.appendChild(span);
          });
          body.appendChild(setHeader);

          const setList = document.createElement('div');
          setList.className = 'set-list';

          block.exercise.sets.forEach((set, setIndex) => {
            const setRow = document.createElement('div');
            setRow.className = 'set-row';

            const indexPill = document.createElement('div');
            indexPill.className = 'set-index-pill';
            indexPill.textContent = String(setIndex + 1);

            const repsInput = document.createElement('input');
            repsInput.type = 'number';
            repsInput.min = '0';
            repsInput.inputMode = 'numeric';
            repsInput.className = 'set-input';
            repsInput.value = String(set.reps ?? DEFAULT_SET_REPS);
            repsInput.addEventListener('input', () => {
              const value = parseInt(repsInput.value, 10);
              set.reps = Number.isNaN(value) ? 0 : value;
              refreshHeader();
            });

            const weightInput = document.createElement('input');
            weightInput.type = 'text';
            weightInput.className = 'set-input';
            weightInput.value = String(set.weight ?? '');
            weightInput.addEventListener('input', () => {
              set.weight = weightInput.value;
              refreshHeader();
            });

            setRow.appendChild(indexPill);
            setRow.appendChild(repsInput);
            setRow.appendChild(weightInput);
            setList.appendChild(setRow);
          });

          body.appendChild(setList);
          card.appendChild(body);
        }
      }

      blockList.appendChild(card);
    });
  }

  function addCompletionFieldsForWorkout(template) {
    const workout = deepClone(template);
    workout.blocks.forEach(block => {
      if (block.type === 'group') {
        block.exercises.forEach(ex => {
          ex.sets.forEach(set => {
            set.isComplete = false;
          });
        });
        return;
      }
      block.exercise.sets.forEach(set => {
        set.isComplete = false;
      });
    });
    return workout;
  }

  function startRestTimer(seconds) {
    const duration = Math.max(0, Math.floor(Number(seconds) || 0));
    if (state.rest.timerId) {
      clearInterval(state.rest.timerId);
      state.rest.timerId = null;
    }
    state.rest.remaining = duration;
    state.rest.isRunning = true;
    restTimerButton.classList.add('is-counting');
    restTimerValue.textContent = formatDuration(state.rest.remaining);

    state.rest.timerId = setInterval(() => {
      if (state.rest.remaining <= 1) {
        clearInterval(state.rest.timerId);
        state.rest.timerId = null;
        state.rest.isRunning = false;
        state.rest.remaining = 0;
        restTimerValue.textContent = formatDuration(state.rest.remaining);
        restTimerButton.classList.remove('is-counting');
        return;
      }
      state.rest.remaining -= 1;
      restTimerValue.textContent = formatDuration(state.rest.remaining);
    }, 1000);
  }

  function setRestIdle(seconds) {
    const duration = Math.max(0, Math.floor(Number(seconds) || 0));
    if (state.rest.timerId) {
      clearInterval(state.rest.timerId);
      state.rest.timerId = null;
    }
    state.rest.remaining = duration;
    state.rest.isRunning = false;
    restTimerButton.classList.remove('is-counting');
    restTimerValue.textContent = formatDuration(state.rest.remaining);
  }

  function toggleRestTimer() {
    if (state.rest.isRunning) {
      clearInterval(state.rest.timerId);
      state.rest.timerId = null;
      state.rest.isRunning = false;
      restTimerButton.classList.remove('is-counting');
      return;
    }
    if (state.rest.remaining <= 0) {
      startRestTimer(DEFAULT_REST_SEC);
      return;
    }

    state.rest.isRunning = true;
    restTimerButton.classList.add('is-counting');
    state.rest.timerId = setInterval(() => {
      if (state.rest.remaining <= 1) {
        clearInterval(state.rest.timerId);
        state.rest.timerId = null;
        state.rest.isRunning = false;
        state.rest.remaining = 0;
        restTimerValue.textContent = formatDuration(state.rest.remaining);
        restTimerButton.classList.remove('is-counting');
        return;
      }
      state.rest.remaining -= 1;
      restTimerValue.textContent = formatDuration(state.rest.remaining);
    }, 1000);
  }

  function resetSession() {
    state.selectedUser = null;
    state.editingTemplateId = null;
    state.editingTemplate = null;
    state.activeWorkout = null;

    setRestIdle(DEFAULT_REST_SEC);

    userCards.forEach(card => card.classList.remove('is-selected'));
    userStartButton.disabled = true;
    workoutTemplateGrid.innerHTML = '';
    templateNameInput.value = '';
    blockList.innerHTML = '';
    activeWorkoutTitle.textContent = 'Active workout';
    activeWorkoutSubtitle.textContent = 'Stay on this screen until you finish.';
    exerciseGrid.innerHTML = '';
    showScreen(screenUser);
  }

  function endWorkoutSession() {
    state.activeWorkout = null;
    state.editingTemplateId = null;
    state.editingTemplate = null;
    setRestIdle(DEFAULT_REST_SEC);
    activeWorkoutTitle.textContent = 'Active workout';
    activeWorkoutSubtitle.textContent = 'Stay on this screen until you finish.';
    exerciseGrid.innerHTML = '';

    if (state.selectedUser) {
      renderTemplatesScreen();
      showScreen(screenWorkouts);
    } else {
      showScreen(screenUser);
    }
  }

  function clearNextHighlights() {
    Array.from(document.querySelectorAll('.set-row.is-next')).forEach(el =>
      el.classList.remove('is-next')
    );
  }

  function findNextTarget() {
    if (!state.activeWorkout) return null;
    const blocks = state.activeWorkout.blocks || [];

    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
      const block = blocks[blockIndex];
      if (block.type === 'group') {
        const rounds = groupRounds(block);
        for (let round = 0; round < rounds; round += 1) {
          for (let exerciseIndex = 0; exerciseIndex < block.exercises.length; exerciseIndex += 1) {
            const set = block.exercises[exerciseIndex].sets[round];
            if (!set) continue;
            if (!set.isComplete) {
              return { blockIndex, exerciseIndex, setIndex: round, kind: 'group' };
            }
          }
        }
        continue;
      }

      for (let setIndex = 0; setIndex < block.exercise.sets.length; setIndex += 1) {
        const set = block.exercise.sets[setIndex];
        if (!set.isComplete) {
          return { blockIndex, exerciseIndex: 0, setIndex, kind: 'single' };
        }
      }
    }

    return null;
  }

  function updateNextHighlight() {
    clearNextHighlights();
    const next = findNextTarget();
    if (!next) return;
    const selector = `[data-workout-block-index="${next.blockIndex}"][data-workout-exercise-index="${next.exerciseIndex}"][data-workout-set-index="${next.setIndex}"]`;
    const row = document.querySelector(selector);
    if (row) row.classList.add('is-next');
  }

  function isGroupRoundComplete(block, roundIndex) {
    return block.exercises.every(ex => {
      const set = ex.sets[roundIndex];
      if (!set) return true;
      return Boolean(set.isComplete);
    });
  }

  function renderActiveWorkout() {
    exerciseGrid.innerHTML = '';
    if (!state.activeWorkout) return;

    activeWorkoutTitle.textContent = state.activeWorkout.name || 'Active workout';
    activeWorkoutSubtitle.textContent = `${state.selectedUser ?? ''} \u00b7 Tap a set to complete`;

    state.activeWorkout.blocks.forEach((block, blockIndex) => {
      if (block.type === 'group') {
        const rounds = groupRounds(block);
        const card = document.createElement('article');
        card.className = 'exercise-card exercise-card--group';

        const header = document.createElement('div');
        header.className = 'exercise-card-header';

        const title = document.createElement('h3');
        title.className = 'exercise-name';
        title.textContent = `${groupLabel(block.exercises.length)} \u00b7 ${rounds} rounds`;

        const meta = document.createElement('p');
        meta.className = 'exercise-meta';
        meta.textContent = `Rest ${formatDuration(block.restSec ?? DEFAULT_REST_SEC)}`;

        header.appendChild(title);
        header.appendChild(meta);
        card.appendChild(header);

        block.exercises.forEach((exercise, exerciseIndex) => {
          const exWrap = document.createElement('div');
          exWrap.className = 'group-active-exercise';

          const exTitle = document.createElement('h4');
          exTitle.className = 'group-active-exercise-title';
          exTitle.textContent = exercise.name;
          exWrap.appendChild(exTitle);

          const headerRow = document.createElement('div');
          headerRow.className = 'set-header-row';
          ['Set', 'Reps', 'Weight'].forEach(label => {
            const span = document.createElement('span');
            span.className = 'set-header-label';
            span.textContent = label;
            headerRow.appendChild(span);
          });
          exWrap.appendChild(headerRow);

          const list = document.createElement('div');
          list.className = 'set-list';

          exercise.sets.forEach((set, setIndex) => {
            const row = document.createElement('div');
            row.className = 'set-row';
            row.dataset.workoutBlockIndex = String(blockIndex);
            row.dataset.workoutExerciseIndex = String(exerciseIndex);
            row.dataset.workoutSetIndex = String(setIndex);
            if (set.isComplete) row.classList.add('is-complete');

            const indexPill = document.createElement('div');
            indexPill.className = 'set-index-pill';
            indexPill.textContent = String(setIndex + 1);

            const repsInput = document.createElement('input');
            repsInput.type = 'number';
            repsInput.min = '0';
            repsInput.inputMode = 'numeric';
            repsInput.className = 'set-input';
            repsInput.value = String(set.reps ?? 0);
            repsInput.addEventListener('input', () => {
              const value = parseInt(repsInput.value, 10);
              set.reps = Number.isNaN(value) ? 0 : value;
            });

            const weightInput = document.createElement('input');
            weightInput.type = 'text';
            weightInput.className = 'set-input';
            weightInput.value = String(set.weight ?? '');
            weightInput.addEventListener('input', () => {
              set.weight = weightInput.value;
            });
            row.addEventListener('click', event => {
              if (event.target && event.target.closest && event.target.closest('input')) return;
              const wasComplete = Boolean(set.isComplete);
              set.isComplete = !wasComplete;
              row.classList.toggle('is-complete', set.isComplete);
              if (!wasComplete && set.isComplete && isGroupRoundComplete(block, setIndex)) {
                startRestTimer(block.restSec ?? DEFAULT_REST_SEC);
              }
              updateNextHighlight();
            });

            row.appendChild(indexPill);
            row.appendChild(repsInput);
            row.appendChild(weightInput);
            list.appendChild(row);
          });

          exWrap.appendChild(list);
          card.appendChild(exWrap);
        });

        exerciseGrid.appendChild(card);
        return;
      }

      const card = document.createElement('article');
      card.className = 'exercise-card';

      const header = document.createElement('div');
      header.className = 'exercise-card-header';

      const title = document.createElement('h3');
      title.className = 'exercise-name';
      title.textContent = block.exercise.name;

      const meta = document.createElement('p');
      meta.className = 'exercise-meta';
      meta.textContent = `${block.exercise.sets.length} sets`;

      header.appendChild(title);
      header.appendChild(meta);
      card.appendChild(header);

      const headerRow = document.createElement('div');
      headerRow.className = 'set-header-row';
      ['Set', 'Reps', 'Weight'].forEach(label => {
        const span = document.createElement('span');
        span.className = 'set-header-label';
        span.textContent = label;
        headerRow.appendChild(span);
      });
      card.appendChild(headerRow);

      const list = document.createElement('div');
      list.className = 'set-list';

      block.exercise.sets.forEach((set, setIndex) => {
        const row = document.createElement('div');
        row.className = 'set-row';
        row.dataset.workoutBlockIndex = String(blockIndex);
        row.dataset.workoutExerciseIndex = '0';
        row.dataset.workoutSetIndex = String(setIndex);
        if (set.isComplete) row.classList.add('is-complete');

        const indexPill = document.createElement('div');
        indexPill.className = 'set-index-pill';
        indexPill.textContent = String(setIndex + 1);

        const repsInput = document.createElement('input');
        repsInput.type = 'number';
        repsInput.min = '0';
        repsInput.inputMode = 'numeric';
        repsInput.className = 'set-input';
        repsInput.value = String(set.reps ?? 0);
        repsInput.addEventListener('input', () => {
          const value = parseInt(repsInput.value, 10);
          set.reps = Number.isNaN(value) ? 0 : value;
        });

        const weightInput = document.createElement('input');
        weightInput.type = 'text';
        weightInput.className = 'set-input';
        weightInput.value = String(set.weight ?? '');
        weightInput.addEventListener('input', () => {
          set.weight = weightInput.value;
        });
        row.addEventListener('click', event => {
          if (event.target && event.target.closest && event.target.closest('input')) return;
          const wasComplete = Boolean(set.isComplete);
          set.isComplete = !wasComplete;
          row.classList.toggle('is-complete', set.isComplete);
          if (!wasComplete && set.isComplete) {
            startRestTimer(block.restSec ?? DEFAULT_REST_SEC);
          }
          updateNextHighlight();
        });

        row.appendChild(indexPill);
        row.appendChild(repsInput);
        row.appendChild(weightInput);
        list.appendChild(row);
      });

      card.appendChild(list);
      exerciseGrid.appendChild(card);
    });

    updateNextHighlight();
  }

  userCards.forEach(card => {
    card.addEventListener('click', () => {
      const user = card.dataset.user;
      state.selectedUser = user;
      userCards.forEach(c => c.classList.toggle('is-selected', c === card));
      userStartButton.disabled = false;
    });
  });

  userStartButton.addEventListener('click', () => {
    if (!state.selectedUser) return;
    renderTemplatesScreen();
    showScreen(screenWorkouts);
  });

  backToUserButton.addEventListener('click', () => {
    state.editingTemplateId = null;
    state.editingTemplate = null;
    state.ui.openSingleBlockId = null;
    state.ui.openGroupSettingsBlockId = null;
    state.ui.openGroupExerciseByBlockId = {};
    showScreen(screenUser);
  });

  backToTemplatesButton.addEventListener('click', () => {
    state.editingTemplateId = null;
    state.editingTemplate = null;
    state.ui.openSingleBlockId = null;
    state.ui.openGroupSettingsBlockId = null;
    state.ui.openGroupExerciseByBlockId = {};
    renderTemplatesScreen();
    showScreen(screenWorkouts);
  });

  templateNameInput.addEventListener('input', () => {
    if (!state.editingTemplate) return;
    state.editingTemplate.name = templateNameInput.value || 'Untitled';
    templateTitle.textContent = state.editingTemplate.name;
  });

  addSingleBlockButton.addEventListener('click', () => {
    if (!state.editingTemplate) return;
    const block = createSingleBlock();
    state.editingTemplate.blocks.push(block);
    state.ui.openSingleBlockId = block.id;
    state.ui.openGroupSettingsBlockId = null;
    renderTemplateEditor();
  });

  addGroupBlockButton.addEventListener('click', () => {
    if (!state.editingTemplate) return;
    const block = createGroupBlock();
    state.editingTemplate.blocks.push(block);
    state.ui.openSingleBlockId = null;
    state.ui.openGroupSettingsBlockId = block.id;
    state.ui.openGroupExerciseByBlockId[block.id] = block.exercises?.[0]?.id ?? null;
    renderTemplateEditor();
  });

  saveTemplateButton.addEventListener('click', () => {
    commitEditingTemplate();
    const original = saveTemplateButton.textContent;
    saveTemplateButton.textContent = 'Saved';
    setTimeout(() => {
      saveTemplateButton.textContent = original;
    }, 900);
  });

  deleteTemplateButton.addEventListener('click', () => {
    if (!state.selectedUser || !state.editingTemplateId) return;
    const template = findTemplate(state.selectedUser, state.editingTemplateId);
    const name = template?.name ?? 'this template';
    if (!confirm(`Delete "${name}"?`)) return;
    const next = getUserTemplates(state.selectedUser).filter(t => t.id !== state.editingTemplateId);
    setUserTemplates(state.selectedUser, next);
    state.editingTemplateId = null;
    state.editingTemplate = null;
    renderTemplatesScreen();
    showScreen(screenWorkouts);
  });

  templateStartButton.addEventListener('click', () => {
    if (!state.selectedUser || !state.editingTemplateId) return;
    commitEditingTemplate();
    const template = findTemplate(state.selectedUser, state.editingTemplateId);
    if (!template) return;
    if (!template.blocks || template.blocks.length === 0) {
      alert('Add at least one block before starting a workout.');
      return;
    }

    state.activeWorkout = addCompletionFieldsForWorkout(template);
    setRestIdle(DEFAULT_REST_SEC);
    renderActiveWorkout();
    showScreen(screenActive);
  });

  finishWorkoutButton.addEventListener('click', () => {
    if (confirm('Finish this workout? This will clear the active session.')) {
      endWorkoutSession();
    }
  });

  restTimerButton.addEventListener('click', () => {
    toggleRestTimer();
  });

  resetAppButton.addEventListener('click', () => {
    if (confirm('Reset the app session? (Templates stay saved on this device.)')) {
      resetSession();
    }
  });

  restTimerValue.textContent = formatDuration(state.rest.remaining);
})();
