<?php
/**
 * TeX Parser - Phân tích file .tex thành câu hỏi
 * 
 * Hỗ trợ 4 dạng:
 * 1. Trắc nghiệm (\choice)
 * 2. Đúng/Sai (\choiceTF)
 * 3. Trả lời ngắn (\shortans)
 * 4. Tự luận (chỉ có \loigiai)
 */
class TexParser {

    /**
     * Parse toàn bộ nội dung .tex file
     * @param string $content Nội dung file .tex
     * @return array Mảng câu hỏi đã parse
     */
    public function parse(string $content): array {
        $content = $this->normalizeContent($content);
        $blocks = $this->extractExBlocks($content);
        $questions = [];

        foreach ($blocks as $index => $block) {
            $parsed = $this->parseBlock($block, $index + 1);
            if ($parsed) {
                $questions[] = $parsed;
            }
        }

        return $questions;
    }

    /**
     * Chuẩn hóa nội dung: xử lý encoding, line endings
     */
    private function normalizeContent(string $content): string {
        // Detect and convert encoding if needed
        $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
        if ($encoding && $encoding !== 'UTF-8') {
            $content = mb_convert_encoding($content, 'UTF-8', $encoding);
        }

        // Normalize line endings
        $content = str_replace(["\r\n", "\r"], "\n", $content);

        return $content;
    }

    /**
     * Tách các block \begin{ex}...\end{ex}
     */
    private function extractExBlocks(string $content): array {
        $blocks = [];
        $pattern = '/\\\\begin\{ex\}(.*?)\\\\end\{ex\}/s';

        if (preg_match_all($pattern, $content, $matches)) {
            $blocks = $matches[1];
        }

        return $blocks;
    }

    /**
     * Parse một block câu hỏi
     */
    private function parseBlock(string $block, int $orderIndex): ?array {
        $block = trim($block);
        if (empty($block)) return null;

        // Extract solution
        $solution = $this->extractSolution($block);
        $blockWithoutSolution = $this->removeSolution($block);

        // Detect question type and parse accordingly
        if (strpos($blockWithoutSolution, '\choiceTF') !== false) {
            return $this->parseTrueFalse($blockWithoutSolution, $solution, $orderIndex);
        }

        if (strpos($blockWithoutSolution, '\choice') !== false) {
            return $this->parseMultipleChoice($blockWithoutSolution, $solution, $orderIndex);
        }

        if (preg_match('/\\\\shortans\s*\[/', $blockWithoutSolution)) {
            return $this->parseShortAnswer($blockWithoutSolution, $solution, $orderIndex);
        }

        // Default: essay
        return $this->parseEssay($blockWithoutSolution, $solution, $orderIndex);
    }

    /**
     * Extract \loigiai{...} content (supports nested braces)
     */
    private function extractSolution(string $block): string {
        $pos = strpos($block, '\loigiai{');
        if ($pos === false) return '';

        $start = $pos + strlen('\loigiai{');
        return $this->extractBracedContent($block, $start);
    }

    /**
     * Remove \loigiai{...} from block
     */
    private function removeSolution(string $block): string {
        $pos = strpos($block, '\loigiai{');
        if ($pos === false) return $block;

        $start = $pos + strlen('\loigiai{');
        $content = $this->extractBracedContent($block, $start);
        $fullLength = strlen('\loigiai{') + strlen($content) + 1; // +1 for closing brace

        return trim(substr($block, 0, $pos) . substr($block, $pos + $fullLength));
    }

    /**
     * Extract content within braces, handling nesting
     */
    private function extractBracedContent(string $text, int $start): string {
        $depth = 1;
        $i = $start;
        $len = strlen($text);

        while ($i < $len && $depth > 0) {
            if ($text[$i] === '{' && ($i === 0 || $text[$i-1] !== '\\')) {
                $depth++;
            } elseif ($text[$i] === '}' && ($i === 0 || $text[$i-1] !== '\\')) {
                $depth--;
            }
            if ($depth > 0) $i++;
        }

        return substr($text, $start, $i - $start);
    }

    /**
     * Parse multiple-choice question (\choice)
     */
    private function parseMultipleChoice(string $block, string $solution, int $orderIndex): array {
        $parts = explode('\choice', $block, 2);
        $questionContent = trim($parts[0]);
        $optionsRaw = $parts[1] ?? '';

        $options = $this->extractOptions($optionsRaw);

        return [
            'order_index' => $orderIndex,
            'question_type' => 'multiple_choice',
            'content' => $questionContent,
            'solution' => $solution,
            'short_answer' => null,
            'options' => $options,
        ];
    }

    /**
     * Parse true/false question (\choiceTF)
     */
    private function parseTrueFalse(string $block, string $solution, int $orderIndex): array {
        $parts = explode('\choiceTF', $block, 2);
        $questionContent = trim($parts[0]);
        $optionsRaw = $parts[1] ?? '';

        $options = $this->extractOptions($optionsRaw);

        return [
            'order_index' => $orderIndex,
            'question_type' => 'true_false',
            'content' => $questionContent,
            'solution' => $solution,
            'short_answer' => null,
            'options' => $options,
        ];
    }

    /**
     * Parse short-answer question (\shortans[]{answer})
     */
    private function parseShortAnswer(string $block, string $solution, int $orderIndex): array {
        $questionContent = '';
        $shortAnswer = '';

        if (preg_match('/(.+?)\\\\shortans\s*\[([^\]]*)\]\s*\{([^}]*)\}/s', $block, $m)) {
            $questionContent = trim($m[1]);
            $shortAnswer = trim($m[3]);
        } else {
            $questionContent = trim($block);
        }

        return [
            'order_index' => $orderIndex,
            'question_type' => 'short_answer',
            'content' => $questionContent,
            'solution' => $solution,
            'short_answer' => $shortAnswer,
            'options' => [],
        ];
    }

    /**
     * Parse essay question (no answer macro)
     */
    private function parseEssay(string $block, string $solution, int $orderIndex): array {
        return [
            'order_index' => $orderIndex,
            'question_type' => 'essay',
            'content' => trim($block),
            'solution' => $solution,
            'short_answer' => null,
            'options' => [],
        ];
    }

    /**
     * Extract options from {content} blocks, detecting \True marker
     */
    private function extractOptions(string $raw): array {
        $options = [];
        $raw = trim($raw);
        $pos = 0;
        $len = strlen($raw);
        $orderIndex = 0;

        while ($pos < $len) {
            // Skip whitespace
            while ($pos < $len && ctype_space($raw[$pos])) $pos++;
            if ($pos >= $len) break;

            // Expect opening brace
            if ($raw[$pos] !== '{') {
                $pos++;
                continue;
            }

            $pos++; // skip '{'
            $content = $this->extractBracedContent($raw, $pos);
            $pos += strlen($content) + 1; // +1 for closing brace

            $isCorrect = false;
            $optionContent = trim($content);

            // Check for \True marker
            if (strpos($optionContent, '\True') !== false) {
                $isCorrect = true;
                $optionContent = trim(str_replace('\True', '', $optionContent));
            }

            $options[] = [
                'order_index' => $orderIndex++,
                'content' => $optionContent,
                'is_correct' => $isCorrect,
            ];
        }

        return $options;
    }
}
