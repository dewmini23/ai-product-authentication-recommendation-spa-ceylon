import { Component } from '@angular/core';

interface FAQ {
    question: string;
    answer: string;
    isOpen: boolean;
}

@Component({
    selector: 'app-faq-section',
    templateUrl: './faq-section.component.html',
    styleUrls: ['./faq-section.component.scss']
})
export class FaqSectionComponent {

    faqs: FAQ[] = [
        {
            question: 'How does the authentication check work?',
            answer: 'We analyze packaging and label cues (fonts, logo placement, color tones, layout, batch/expiry markings) and compare them with trusted patterns to return a confidence-based result.',
            isOpen: false
        },
        {
            question: 'What counterfeit signs does the system detect?',
            answer: 'We flag inconsistencies such as packaging layout changes, spelling/typography errors, unusual color/finish, mismatched logos, missing/invalid batch or expiry details, and low-quality printing.',
            isOpen: false
        },
        {
            question: 'How do AI recommendations work?',
            answer: 'Recommendations are generated from your skin type, concerns, goals, and product attributes—so you get suggestions that fit your routine, not random products.',
            isOpen: false
        },
        {
            question: 'What photos/details should I provide for the best verification result?',
            answer: 'Upload clear photos in good lighting: front label, back label/ingredients, and the batch/expiry area. Avoid blur, glare, and heavy cropping.',
            isOpen: false
        },
        {
            question: 'What if the result is “uncertain” or I disagree with it?',
            answer: 'Try re-uploading clearer photos from multiple angles. If confidence remains low, use the “Report” option for review and follow the guidance shown.',
            isOpen: false
        }
    ];

    toggle(index: number): void {
        // Behavior: Only one open at a time
        this.faqs.forEach((faq, i) => {
            if (i === index) {
                faq.isOpen = !faq.isOpen;
            } else {
                faq.isOpen = false;
            }
        });
    }
}
