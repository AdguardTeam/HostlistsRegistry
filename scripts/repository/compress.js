/* eslint-disable no-console */
const simpleGit = require('simple-git');

let commitsToKeep = 10000;

const firstArgument = process.argv[2];
if (firstArgument) {
    const number = Number.parseInt(firstArgument, 10);
    commitsToKeep = number;
}

/**
 * Git script to squash history and push changes.
 *
 * @async
 * @function squashAndPush
 *
 * @returns {Promise<void>} - A promise that resolves when the process is complete.
 */
async function squashAndPush() {
    // Add `trim` call to remove trailing newlines from the output of git.raw.
    const git = simpleGit({ trimmed: true });

    const headBeforeSquashHash = await git.revparse(['HEAD']);

    // Step 1: Checkout to the commitsToKeep'th commit and save its hash
    await git.checkout(`HEAD~${commitsToKeep}`);
    const squashedCommitHash = await git.raw([
        'rev-parse',
        'HEAD',
    ]);
    console.log(`Step 1: Checked out to commit ${squashedCommitHash}`);

    try {
        // Step 2: Create a new branch named 'squashed'
        await git.checkoutBranch('squashed', squashedCommitHash);
    } catch (e) {
        // If the branch already exists, checkout to it
        if (e.message.includes('already exists')) {
            console.log('Branch "squashed" already exists. Delete it (`git branch -D squashed`) and try again.');
            return;
        }

        throw e;
    }
    console.log('Step 2: Created branch "squashed"');

    // Step 3: Get the hash of the very first commit
    const firstCommitHash = await git.raw([
        'rev-list',
        '--max-parents=0',
        'HEAD',
    ]);
    console.log(`Step 3: Retrieved hash of the first commit: ${firstCommitHash}`);

    // Step 4: Drop all directories to the very first commit
    await git.reset(['--mixed', firstCommitHash]);
    console.log('Step 4: Dropped all directories to the first commit');

    // Step 5: Add everything to the index
    await git.add('.');
    console.log('Step 5: Added all changes to the index');

    // Extract date from commit with squashed history
    const { date: squashedCommitDate } = await git.log({
        from: squashedCommitHash,
        to: `${squashedCommitHash}~1`,
    });
    // Use this date to keep history linear for commit with squashed history
    git.env('GIT_COMMITTER_DATE', squashedCommitDate);

    // Step 6: Create a commit for squashed history
    await git.commit(`squashed history from ${firstCommitHash} to ${squashedCommitHash}`);
    // eslint-disable-next-line max-len
    console.log(`Step 6: Created commit for squashed history from ${firstCommitHash} to ${squashedCommitHash}`);

    // Step 7: Cherry-pick the commits you want to store
    // Use the `log` method with a range specification to get the commit history
    const historyToSave = await git.log({
        from: squashedCommitHash,
        to: headBeforeSquashHash,
        '--no-merges': true,
    });
    console.log('Step 7: commits to cherry-pick:', historyToSave.all.length);
    const commits = historyToSave.all.reverse();
    for (let i = 0; i < commits.length; i += 1) {
        const {
            hash,
            date,
        } = commits[i];

        // Save original commit date.
        git.env('GIT_COMMITTER_DATE', date);

        /* eslint-disable no-await-in-loop */
        try {
            // Use git cherry-pick command for each commit to cherry-pick.
            await git.raw(['cherry-pick', hash, '--strategy-option', 'theirs']);
            console.debug(`Cherry-picked commit#${i} ${hash}`);
        } catch (e) {
            if (e.message.includes('nothing to commit, working tree clean')) {
                console.debug(`Commit#${i} ${hash} skipped because it is empty.`);
                await git.raw(['cherry-pick', '--skip']);

                // eslint-disable-next-line no-continue
                continue;
            }

            throw e;
        }
        /* eslint-enable no-await-in-loop */
    }

    // Step 8: Return to the 'master' branch
    await git.checkout('master');
    console.log('Step 8: Returned to the "master" branch');

    // Step 9: Reset 'master' to our new rebased 'master'
    await git.reset(['--hard', 'squashed']);
    console.log('Step 9: Reset "master" to the new rebased "master"');

    console.log('Git actions for compression completed successfully.');
}

// Execute the squashAndPush function
squashAndPush();
