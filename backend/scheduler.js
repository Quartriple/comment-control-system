const { db } = require('./db');
const cron = require('node-cron');
const comment = require('./models/comment');

const AI_SERVER_URL = 'http://localhost:5000/batch-detect'
const BATCH_SIZE = 10;

async function processCommentBatch() {
    console.log('--- Batch processing initiated ---');
    try {
        const pendingComments = await db.Comment.findAll({
            where: { status: 'PENDING' },
            limit: BATCH_SIZE,
            order:  [['createdAt', 'ASC']],
            attributes: ['id', 'content']
        });

        if (pendingComments.length === 0) {
            console.log('No pending comments to process.');
            return;
        }

        console.log(`Processing ${pendingComments.length} comments...`);

        const batchData = pendingComments.map(comment => ({
            id: comment.id,
            content: comment.content
        }));

        const aiResponse = await fetch(AI_SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comments: batchData })
        });

        if (!aiResponse.ok) {
            console.error('AI Server returned non-OK status.');
            throw new Error('AI Server batch detection failed.');
        }

        const aiResult = await aiResponse.json();
        const results = aiResult.results;
        console.log(`results: ${results}`)
        for (const result of results) {
            const updateData = {};
            if (result.status === 'PROCESSED') {
                updateData.hate_score = result.hate_score;
                updateData.hate_reasoning = result.hate_reasoning;
                updateData.veracity = result.veracity;
                updateData.veracity_reasoning = result.veracity_reasoning;
                updateData.source = result.source;
                updateData.topic = result.topic;
                updateData.category = result.category;
                updateData.status = 'PROCESSED';
            } else {
                updateData.status = 'FAILED';
                console.error(`Analysis failed for comment ID ${result.id}: ${result.error}`);
            }
            await db.Comment.update(updateData, { where: { id: result.id }});
        }
        
        console.log(`Successfully processed ${results.filter(r => r.status === 'PROCESSED').length} comments.`);
    } catch (error) {
        console.error('Error during batch processing:', error);
    }
    console.log('--- Batch processing finished ---');
}

module.exports = { processCommentBatch };