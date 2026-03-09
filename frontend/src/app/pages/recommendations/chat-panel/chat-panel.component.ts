import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';

export interface ChatMessage {
    text: string;
    sender: 'user' | 'assistant';
    tags?: string[];
}

@Component({
    selector: 'app-chat-panel',
    templateUrl: './chat-panel.component.html',
    styleUrls: ['./chat-panel.component.scss']
})
export class ChatPanelComponent implements AfterViewChecked {
    @Input() messages: ChatMessage[] = [];
    @Input() isTyping: boolean = false;

    @Output() sendMessage = new EventEmitter<string>();

    @ViewChild('chatScroll') private chatScrollContainer!: ElementRef;

    quickStartChips = [
        'I have acne', 'Oily skin', 'Hair fall', 'Dry skin', 'Stress & sleep'
    ];

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    scrollToBottom(): void {
        try {
            this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
        } catch (err) { }
    }

    onSend(inputEl: HTMLInputElement) {
        const text = inputEl.value.trim();
        if (text) {
            this.sendMessage.emit(text);
            inputEl.value = '';
        }
    }

    onChipClick(chipText: string) {
        this.sendMessage.emit(chipText);
    }
}
