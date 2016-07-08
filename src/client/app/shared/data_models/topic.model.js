var Topic = (function () {
    function Topic(topic, icon, featured, selected) {
        this.topic = topic;
        this.icon = icon;
        this.featured = featured;
        this.selected = selected;
    }
    Topic.prototype.toggleSelected = function () {
        this.selected = !this.selected;
    };
    return Topic;
})();
exports.Topic = Topic;
//# sourceMappingURL=topic.model.js.map