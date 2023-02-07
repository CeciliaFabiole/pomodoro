import inquirer from 'inquirer';
import cliProgress from 'cli-progress';
import notifier from 'node-notifier';
// import colors from 'ansi-colors';
const confirmAnswerValidator = async (input) => {
	if (input < 0) {
		return 'Negative numbers are not valid';
	}
	return true;
};
const confirmTotalValidator = async (input) => {
	if (input * 60 < 60) {
		return 'Total must be greater than an hour';
	}
	return true;
};
const confirmPomodoroValidator = async (input) => {
	if (input > 60) {
		return 'Total must be smaller than an hour';
	}
	return true;
};
inquirer
	.prompt([
		{
			type: 'number',
			name: 'totale',
			message: 'Ore di lavoro totali',
			default: 8,
			choices: [4, 8, 12],
			validate: confirmAnswerValidator,
			validate: confirmTotalValidator,
		},
		{
			type: 'number',
			name: 'pomodoro',
			message: 'Durata di un pomodoro (minuti di lavoro)',
			default: 25,
			choices: [15, 30, 45],
			validate: confirmAnswerValidator,
			validate: confirmPomodoroValidator,
		},
		{
			type: 'number',
			name: 'pausaBreve',
			message: 'Durata di una pausa breve',
			default: 5,
			choices: [2, 5, 10],
			validate: confirmAnswerValidator,
		},
		{
			type: 'number',
			name: 'pausaLunga',
			message: 'Durata di una pausa lunga',
			default: 15,
			choices: [10, 15, 20],
			validate: confirmAnswerValidator,
		},
		{
			type: 'number',
			name: 'cicli',
			message: 'Numero di cicli prima di una pausa lunga',
			default: 4,
			choices: [2, 4, 6, 8],
			validate: confirmAnswerValidator,
		},
	])
	.then((answers) => {
		console.log(answers);
		const MINUTES = 60;
		const totalMinutes = answers.totale * MINUTES;
		const tomato = answers.pomodoro;
		const littleBreak = answers.pausaBreve;
		const bigBreak = answers.pausaLunga;
		const cycle = answers.cicli;
		// create new container
		const multibar = new cliProgress.MultiBar(
			{
				format: '{name} | {bar} | {value}/{total}',
				hideCursor: true,
				barCompleteChar: '\u2588',
				barIncompleteChar: '\u2591',
				clearOnComplete: true,
				stopOnComplete: true,
				noTTYOutput: true,
			},
			cliProgress.Presets.shades_grey
		);

		// add bars
		const totale = multibar.create(totalMinutes, 0, { name: 'totale' });
		const pomodoro = multibar.create(tomato, 0, { name: 'pomodoro' });
		const pausaBreve = multibar.create(littleBreak, 0, { name: 'pausaBreve' });
		const pausaLunga = multibar.create(bigBreak, 0, { name: 'pausaLunga' });

		//PROMISE
		function barIncrement(bar) {
			return new Promise((resolve) => {
				const timer = setInterval(() => {
					if (bar.value < bar.total) {
						bar.increment();
					} else {
						clearInterval(timer);

						resolve(bar.value);
						bar.value = 0;
					}
				}, 100);
			});
		}
		//ASYNC/AWAIT CON FOR
		const getCycle = async () => {
			for (let i = 0; i < cycle; i++) {
				const value = await barIncrement(pomodoro);
				totale.update(totale.value + value);
				await barIncrement(pausaBreve);
			}
			await barIncrement(pausaLunga);
		};
		//NESTING CYCLE1 IN CYCLE2
		const getBigCycle = async () => {
			const value = totalMinutes / (tomato * cycle);
			for (let j = 0; j < value; j++) {
				await getCycle();
			}
			multibar.stop();
			//send notification when the working hours finished
			notifier.notify(
				{
					title: 'My notification',
					message: 'Le ore di lavoro sono finite!',
					wait: true,
					sound: true,
				},
				function (err, response, data) {
					console.log(response);
					console.log(err, data);
				}
			);
		};
		getBigCycle();
	})
	.catch((error) => {
		if (error.isTtyError) {
			console.log('Prompt couldnt be rendered in the current environment');
		} else {
			console.log('Something else went wrong');
		}
	});
