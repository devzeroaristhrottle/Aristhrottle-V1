import Tags from "@/models/Tags";
import mongoose from "mongoose";
import TagCooccurrence from "@/models/TagCooccurrence";

/**
 * Updates the relevance score for tags based on their various activity counts
 * Formula: relevance = (2 * vote_count) + (3 * share_count) + (1 * upload_count) + 
 *                      (1 * search_count) + (3 * bookmark_count)
 * 
 * @param tagIds Array of tag IDs to update
 */
export async function updateTagsRelevance(tagIds: mongoose.Types.ObjectId[] | string[]) {
  try {
    // For each tag ID, fetch the document, calculate relevance, and update it
    const bulkOps = tagIds.map((tagId) => ({
      updateOne: {
        filter: { _id: tagId },
        update: [
          {
            $set: {
              relevance: {
                $add: [
                  { $multiply: [2, "$vote_count"] },
                  { $multiply: [3, "$share_count"] },
                  { $multiply: [1, "$upload_count"] },
                  { $multiply: [1, { $ifNull: ["$search_count", 0] }] },
                  { $multiply: [3, { $ifNull: ["$bookmark_count", 0] }] }
                ]
              }
            }
          }
        ]
      }
    }));

    if (bulkOps.length > 0) {
      await Tags.bulkWrite(bulkOps);
    }
  } catch (error) {
    console.error("Error updating tag relevance scores:", error);
  }
}

/**
 * Recalculates relevance scores for all tags in the database
 */
export async function recalculateAllTagRelevanceScores() {
  try {
    // Use updateMany with aggregation pipeline to update all documents
    await Tags.updateMany(
      {},
      [
        {
          $set: {
            relevance: {
              $add: [
                { $multiply: [2, "$vote_count"] },
                { $multiply: [3, "$share_count"] },
                { $multiply: [1, "$upload_count"] },
                { $multiply: [1, { $ifNull: ["$search_count", 0] }] },
                { $multiply: [3, { $ifNull: ["$bookmark_count", 0] }] }
              ]
            }
          }
        }
      ]
    );
    console.log("All tag relevance scores have been updated");
  } catch (error) {
    console.error("Error recalculating all tag relevance scores:", error);
  }
}

/**
 * Updates the co-occurrence count for pairs of tags
 * @param tagIds Array of tag IDs that were used together
 */
export async function updateTagCooccurrences(tagIds: mongoose.Types.ObjectId[] | string[]) {
  try {
    if (tagIds.length < 2) return; // Need at least 2 tags for co-occurrence

    const bulkOps = [];
    
    // Create pairs of tags and update their co-occurrence counts
    for (let i = 0; i < tagIds.length; i++) {
      for (let j = i + 1; j < tagIds.length; j++) {
        const tag1 = tagIds[i].toString();
        const tag2 = tagIds[j].toString();
        
        // Ensure tag1 is lexicographically smaller than tag2
        const [smallerTag, largerTag] = tag1 < tag2 ? [tag1, tag2] : [tag2, tag1];
        
        bulkOps.push({
          updateOne: {
            filter: {
              tag1: new mongoose.Types.ObjectId(smallerTag),
              tag2: new mongoose.Types.ObjectId(largerTag)
            },
            update: { $inc: { count: 1 } },
            upsert: true // Create if doesn't exist
          }
        });
      }
    }

    if (bulkOps.length > 0) {
      await TagCooccurrence.bulkWrite(bulkOps);
    }
  } catch (error) {
    console.error("Error updating tag co-occurrences:", error);
  }
} 