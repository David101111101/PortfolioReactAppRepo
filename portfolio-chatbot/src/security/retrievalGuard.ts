/*
 *It guards retrieval quality
 *It enforces hallucination prevention
 *It blocks low-confidence generation
 */
interface RetrievedDocument {
	id?: number | string;
	similarity?: number;
	content?: string;
	metadata?: unknown;
}

//result contract
export interface RetrievalGuardResult {
	allowed: boolean;
	filteredDocs: SafeRetrievedDocument[];
	reason?: string;
	stats: RetrievalStats;
}
export interface SafeRetrievedDocument {
	id?: number | string;
	similarity: number;
	content: string;
	metadata?: SafeMetadata;
}
export interface SafeMetadata {
	priority?: 'high' | 'medium' | 'normal';
	source?: string;
}

export interface RetrievalStats {
	rawCount: number;
	passedCount: number;
	droppedCount: number;
	avgSimilarity: number;
	maxSimilarity: number;
	minSimilarity: number;
}

function isRetrievedDocument(document: unknown): document is RetrievedDocument {
	return typeof document === 'object' && document !== null;
}

// This function inspects retrieved documents for quality and relevance, applying a similarity threshold
export function inspectRetrieval(documents: unknown, minSimilarity: number): RetrievalGuardResult {
	//Validate array format
	if (!Array.isArray(documents)) {
		return {
			allowed: false,
			filteredDocs: [],
			reason: 'invalid_format',
			stats: {
				rawCount: 0,
				passedCount: 0,
				droppedCount: 0,
				avgSimilarity: 0,
				maxSimilarity: 0,
				minSimilarity: 0,
			},
		};
	}

	const retrievedDocuments = documents.filter(isRetrievedDocument);

	// Log minSimilarity against each received document's similarity
	retrievedDocuments.forEach((doc) => {
		if (typeof doc?.similarity === 'number') {
			console.log(`Document ${doc.id ?? ''} similarity: ${doc.similarity} (minSimilarity: ${minSimilarity})`);
		}
	});

	//Apply similarity threshold
	const filtered: SafeRetrievedDocument[] = retrievedDocuments
		.filter(
			(doc): doc is RetrievedDocument & { similarity: number; content: string } =>
				typeof doc?.similarity === 'number' &&
				doc.similarity >= minSimilarity &&
				typeof doc?.content === 'string' &&
				doc.content.trim().length > 0,
		)
		.map((doc) => ({
			id: doc.id,
			similarity: doc.similarity,
			content: doc.content.trim(),
			metadata: sanitizeMetadata(doc.metadata),
		}));

	const rawCount = retrievedDocuments.length;
	const passedCount = filtered.length;
	const droppedCount = rawCount - passedCount;

	//Compute stats
	const similarities = retrievedDocuments
		.map((d) => (typeof d.similarity === 'number' ? d.similarity : null))
		.filter((v): v is number => v !== null);

	const avgSimilarity = similarities.length > 0 ? similarities.reduce((a, b) => a + b, 0) / similarities.length : 0;

	const maxSimilarity = similarities.length > 0 ? Math.max(...similarities) : 0;

	const minSim = similarities.length > 0 ? Math.min(...similarities) : 0;

	const stats: RetrievalStats = {
		rawCount,
		passedCount,
		droppedCount,
		avgSimilarity,
		maxSimilarity,
		minSimilarity: minSim,
	};

	if (filtered.length === 0) {
		return {
			allowed: false,
			filteredDocs: [],
			reason: 'low_similarity',
			stats,
		};
	}

	return {
		allowed: true,
		filteredDocs: filtered,
		stats,
	};

	function sanitizeMetadata(meta: unknown): SafeMetadata | undefined {
		if (!meta || typeof meta !== 'object') return undefined;

		const m = meta as Record<string, unknown>;

		return {
			priority: m.priority === 'high' || m.priority === 'medium' || m.priority === 'normal' ? m.priority : undefined,
			source: typeof m.source === 'string' ? m.source : undefined,
		};
	}
}
