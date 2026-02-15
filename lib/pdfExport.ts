import { WorkoutSession, TrainingPlan, TrainingDay, MuscleGroup } from '@/types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Muscle group German names
const muscleNames: Record<MuscleGroup, string> = {
  chest: 'Brust', back: 'Rücken', shoulders: 'Schultern', biceps: 'Bizeps',
  triceps: 'Trizeps', forearms: 'Unterarme', abs: 'Bauch', quadriceps: 'Quadrizeps',
  hamstrings: 'Beinbeuger', calves: 'Waden', glutes: 'Gesäß', traps: 'Trapez', lats: 'Latissimus',
  adductors: 'Adduktoren', abductors: 'Abduktoren', lower_back: 'Unterer Rücken', neck: 'Nacken'
};

// Generate PDF for a single workout session
export function generateWorkoutPDF(
  session: WorkoutSession,
  exerciseDatabase: any[]
): void {
  const content = generateWorkoutContent(session, exerciseDatabase);
  downloadPDF(content, `workout_${format(new Date(session.startTime), 'yyyy-MM-dd')}.html`);
}

// Generate PDF for workout history
export function generateWorkoutHistoryPDF(
  sessions: WorkoutSession[],
  exerciseDatabase: any[],
  period: 'week' | 'month' | 'all' = 'month'
): void {
  const content = generateHistoryContent(sessions, exerciseDatabase, period);
  downloadPDF(content, `workout_history_${format(new Date(), 'yyyy-MM-dd')}.html`);
}

// Generate PDF for statistics
export function generateStatisticsPDF(
  sessions: WorkoutSession[],
  exerciseDatabase: any[],
  stats: {
    totalVolume: number;
    workoutCount: number;
    totalSets: number;
    avgDuration: number;
    volumeByMuscle: Record<MuscleGroup, number>;
  }
): void {
  const content = generateStatsContent(sessions, exerciseDatabase, stats);
  downloadPDF(content, `statistics_${format(new Date(), 'yyyy-MM-dd')}.html`);
}

// Generate PDF for training plan
export function generateTrainingPlanPDF(
  plan: TrainingPlan,
  trainingDays: TrainingDay[],
  exerciseDatabase: any[]
): void {
  const content = generatePlanContent(plan, trainingDays, exerciseDatabase);
  downloadPDF(content, `training_plan_${plan.name.replace(/\s+/g, '_')}.html`);
}

function generateWorkoutContent(session: WorkoutSession, exerciseDatabase: any[]): string {
  const date = format(new Date(session.startTime), 'dd. MMMM yyyy', { locale: de });
  const duration = session.duration || 0;
  
  let exercisesHtml = '';
  session.exercises.forEach(ex => {
    const exerciseData = exerciseDatabase.find(e => e.id === ex.exerciseId);
    const exerciseName = exerciseData?.name || ex.exerciseId;
    
    let setsHtml = '';
    ex.sets.forEach((set, idx) => {
      if (set.completed) {
        const warmupBadge = set.isWarmup ? '<span class="warmup-badge">Aufwärmen</span>' : '';
        const assistedBadge = set.isAssisted ? '<span class="assisted-badge">Assistiert</span>' : '';
        setsHtml += `
          <tr>
            <td>${idx + 1}</td>
            <td>${Math.abs(set.weight)} kg ${set.isAssisted && set.weight < 0 ? '(Unterstützung)' : ''}</td>
            <td>${set.reps}</td>
            <td>${set.rir ?? '-'}</td>
            <td>${warmupBadge}${assistedBadge}</td>
          </tr>
        `;
      }
    });
    
    const completedSets = ex.sets.filter(s => s.completed && !s.isWarmup);
    const exerciseVolume = completedSets.reduce((sum, s) => sum + Math.abs(s.weight) * s.reps, 0);
    
    exercisesHtml += `
      <div class="exercise-card">
        <h3>${exerciseName}</h3>
        <p class="muscle-groups">${exerciseData?.muscleGroups?.map((m: MuscleGroup) => muscleNames[m] || m).join(', ') || ''}</p>
        <table>
          <thead>
            <tr>
              <th>Satz</th>
              <th>Gewicht</th>
              <th>Wdh</th>
              <th>RIR</th>
              <th>Typ</th>
            </tr>
          </thead>
          <tbody>
            ${setsHtml}
          </tbody>
        </table>
        <p class="exercise-volume">Volumen: ${exerciseVolume.toLocaleString('de-DE')} kg</p>
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Workout - ${date}</title>
      ${getStyles()}
    </head>
    <body>
      <div class="container">
        <header>
          <h1>🏋️ Workout Protokoll</h1>
          <div class="meta">
            <p><strong>Datum:</strong> ${date}</p>
            <p><strong>Training:</strong> ${session.trainingDayName}</p>
            <p><strong>Dauer:</strong> ${duration} Minuten</p>
            <p><strong>Gesamt-Volumen:</strong> ${session.totalVolume.toLocaleString('de-DE')} kg</p>
          </div>
        </header>
        
        <main>
          ${exercisesHtml}
        </main>
        
        <footer>
          <p>Erstellt am ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })} • GymApp Pro</p>
        </footer>
      </div>
    </body>
    </html>
  `;
}

function generateHistoryContent(
  sessions: WorkoutSession[], 
  exerciseDatabase: any[],
  period: string
): string {
  const periodLabels = { week: 'Diese Woche', month: 'Diesen Monat', all: 'Gesamt' };
  const totalVolume = sessions.reduce((sum, s) => sum + s.totalVolume, 0);
  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  
  let workoutsHtml = '';
  sessions.forEach(session => {
    const date = format(new Date(session.startTime), 'dd.MM.yyyy', { locale: de });
    workoutsHtml += `
      <tr>
        <td>${date}</td>
        <td>${session.trainingDayName}</td>
        <td>${session.duration || 0} min</td>
        <td>${session.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed && !s.isWarmup).length, 0)}</td>
        <td>${session.totalVolume.toLocaleString('de-DE')} kg</td>
      </tr>
    `;
  });

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Workout Historie - ${periodLabels[period as keyof typeof periodLabels]}</title>
      ${getStyles()}
    </head>
    <body>
      <div class="container">
        <header>
          <h1>📊 Workout Historie</h1>
          <div class="meta">
            <p><strong>Zeitraum:</strong> ${periodLabels[period as keyof typeof periodLabels]}</p>
            <p><strong>Anzahl Trainings:</strong> ${sessions.length}</p>
            <p><strong>Gesamt-Volumen:</strong> ${totalVolume.toLocaleString('de-DE')} kg</p>
            <p><strong>Gesamt-Dauer:</strong> ${totalDuration} Minuten</p>
          </div>
        </header>
        
        <main>
          <table class="full-width">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Training</th>
                <th>Dauer</th>
                <th>Sätze</th>
                <th>Volumen</th>
              </tr>
            </thead>
            <tbody>
              ${workoutsHtml}
            </tbody>
          </table>
        </main>
        
        <footer>
          <p>Erstellt am ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })} • GymApp Pro</p>
        </footer>
      </div>
    </body>
    </html>
  `;
}

function generateStatsContent(
  sessions: WorkoutSession[],
  exerciseDatabase: any[],
  stats: any
): string {
  let muscleVolumeHtml = '';
  if (stats.volumeByMuscle) {
    Object.entries(stats.volumeByMuscle)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .forEach(([muscle, volume]) => {
        muscleVolumeHtml += `
          <tr>
            <td>${muscleNames[muscle as MuscleGroup] || muscle}</td>
            <td>${(volume as number).toLocaleString('de-DE')} kg</td>
          </tr>
        `;
      });
  }

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Trainings-Statistiken</title>
      ${getStyles()}
    </head>
    <body>
      <div class="container">
        <header>
          <h1>📈 Trainings-Statistiken</h1>
          <div class="stats-grid">
            <div class="stat-card">
              <h3>Gesamt-Volumen</h3>
              <p class="stat-value">${stats.totalVolume.toLocaleString('de-DE')} kg</p>
            </div>
            <div class="stat-card">
              <h3>Trainings</h3>
              <p class="stat-value">${stats.workoutCount}</p>
            </div>
            <div class="stat-card">
              <h3>Sätze</h3>
              <p class="stat-value">${stats.totalSets}</p>
            </div>
            <div class="stat-card">
              <h3>Ø Dauer</h3>
              <p class="stat-value">${stats.avgDuration} min</p>
            </div>
          </div>
        </header>
        
        <main>
          <h2>Volumen nach Muskelgruppe</h2>
          <table class="full-width">
            <thead>
              <tr>
                <th>Muskelgruppe</th>
                <th>Volumen</th>
              </tr>
            </thead>
            <tbody>
              ${muscleVolumeHtml}
            </tbody>
          </table>
        </main>
        
        <footer>
          <p>Erstellt am ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })} • GymApp Pro</p>
        </footer>
      </div>
    </body>
    </html>
  `;
}

function generatePlanContent(
  plan: TrainingPlan,
  trainingDays: TrainingDay[],
  exerciseDatabase: any[]
): string {
  let daysHtml = '';
  
  plan.trainingDays.forEach((dayId, index) => {
    const day = trainingDays.find(d => d.id === dayId);
    if (!day) return;
    
    let exercisesHtml = '';
    day.exercises.forEach(ex => {
      const exerciseData = exerciseDatabase.find(e => e.id === ex.exerciseId);
      const exerciseName = exerciseData?.name || ex.exerciseId;
      exercisesHtml += `
        <tr>
          <td>${exerciseName}</td>
          <td>${ex.sets.length}</td>
          <td>${ex.sets[0]?.reps || '-'}</td>
          <td>${exerciseData?.muscleGroups?.map((m: MuscleGroup) => muscleNames[m] || m).join(', ') || ''}</td>
        </tr>
      `;
    });
    
    daysHtml += `
      <div class="day-card">
        <h3>Tag ${index + 1}: ${day.name}</h3>
        <table>
          <thead>
            <tr>
              <th>Übung</th>
              <th>Sätze</th>
              <th>Wdh</th>
              <th>Muskeln</th>
            </tr>
          </thead>
          <tbody>
            ${exercisesHtml}
          </tbody>
        </table>
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Trainingsplan - ${plan.name}</title>
      ${getStyles()}
    </head>
    <body>
      <div class="container">
        <header>
          <h1>📋 Trainingsplan</h1>
          <div class="meta">
            <p><strong>Name:</strong> ${plan.name}</p>
            <p><strong>Einheiten/Woche:</strong> ${plan.sessionsPerWeek}</p>
            <p><strong>Anzahl Trainingstage:</strong> ${plan.trainingDays.length}</p>
          </div>
        </header>
        
        <main>
          ${daysHtml}
        </main>
        
        <footer>
          <p>Erstellt am ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })} • GymApp Pro</p>
        </footer>
      </div>
    </body>
    </html>
  `;
}

function getStyles(): string {
  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #1e293b;
        background: #f8fafc;
        padding: 2rem;
      }
      .container {
        max-width: 900px;
        margin: 0 auto;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        overflow: hidden;
      }
      header {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        padding: 2rem;
      }
      header h1 { font-size: 2rem; margin-bottom: 1rem; }
      .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
      .meta p { font-size: 0.9rem; opacity: 0.9; }
      main { padding: 2rem; }
      .stats-grid { 
        display: grid; 
        grid-template-columns: repeat(4, 1fr); 
        gap: 1rem; 
        margin-top: 1rem;
      }
      .stat-card {
        background: rgba(255,255,255,0.1);
        border-radius: 0.75rem;
        padding: 1rem;
        text-align: center;
      }
      .stat-card h3 { font-size: 0.75rem; opacity: 0.8; margin-bottom: 0.25rem; }
      .stat-value { font-size: 1.5rem; font-weight: bold; }
      .exercise-card, .day-card {
        background: #f8fafc;
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        border: 1px solid #e2e8f0;
      }
      .exercise-card h3, .day-card h3 { 
        color: #3b82f6; 
        margin-bottom: 0.5rem; 
        font-size: 1.1rem;
      }
      .muscle-groups { color: #64748b; font-size: 0.85rem; margin-bottom: 1rem; }
      .exercise-volume { 
        margin-top: 1rem; 
        font-weight: 600; 
        color: #10b981; 
        text-align: right;
      }
      table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
      th, td { 
        padding: 0.75rem; 
        text-align: left; 
        border-bottom: 1px solid #e2e8f0;
      }
      th { 
        background: #f1f5f9; 
        font-weight: 600; 
        color: #475569;
        font-size: 0.85rem;
      }
      .full-width { margin-top: 1rem; }
      .warmup-badge {
        background: #fef3c7;
        color: #92400e;
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        margin-right: 0.25rem;
      }
      .assisted-badge {
        background: #f3e8ff;
        color: #7c3aed;
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.75rem;
      }
      footer {
        text-align: center;
        padding: 1.5rem;
        color: #94a3b8;
        font-size: 0.85rem;
        border-top: 1px solid #e2e8f0;
      }
      h2 { color: #1e293b; margin-bottom: 1rem; font-size: 1.25rem; }
      @media print {
        body { background: white; padding: 0; }
        .container { box-shadow: none; }
      }
    </style>
  `;
}

function downloadPDF(content: string, filename: string): void {
  // Create a Blob with the HTML content
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  // Create a new window for printing
  const printWindow = window.open(url, '_blank');
  
  if (printWindow) {
    printWindow.onload = () => {
      // Give it a moment to render
      setTimeout(() => {
        printWindow.print();
        // Clean up the URL object after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, 250);
    };
  } else {
    // Fallback: download as HTML
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Alternative: Export to CSV for spreadsheet import
export function exportToCSV(sessions: WorkoutSession[], exerciseDatabase: any[]): void {
  let csv = 'Datum,Training,Übung,Satz,Gewicht (kg),Wiederholungen,RIR,Aufwärmen,Assistiert\n';
  
  sessions.forEach(session => {
    const date = format(new Date(session.startTime), 'yyyy-MM-dd');
    session.exercises.forEach(ex => {
      const exerciseData = exerciseDatabase.find(e => e.id === ex.exerciseId);
      const exerciseName = exerciseData?.name || ex.exerciseId;
      
      ex.sets.forEach((set, idx) => {
        if (set.completed) {
          csv += `${date},${session.trainingDayName},"${exerciseName}",${idx + 1},${set.weight},${set.reps},${set.rir ?? ''},${set.isWarmup ? 'Ja' : 'Nein'},${set.isAssisted ? 'Ja' : 'Nein'}\n`;
        }
      });
    });
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workout_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
