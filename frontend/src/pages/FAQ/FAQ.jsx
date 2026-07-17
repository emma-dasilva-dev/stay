import { useState } from "react";
import "./faq.css";

const faqItems = [
  {
    id: 1,
    category: "reservation",
    question: "Comment fonctionne la réservation ?",
    answer:
      "Remplissez le formulaire de réservation. Votre demande est ensuite transmise à STAY, puis vous êtes redirigé vers WhatsApp afin de finaliser votre séjour avec notre équipe.",
  },
  {
    id: 2,
    category: "payment",
    question: "Les tarifs affichés sont-ils définitifs ?",
    answer:
      "Les tarifs sont donnés à titre indicatif. Le montant final peut varier selon la période, le type de chambre choisi et les disponibilités de l’établissement.",
  },
  {
    id: 3,
    category: "reservation",
    question: "Comment ma réservation est-elle confirmée ?",
    answer:
      "Après réception de votre demande, notre équipe vérifie les disponibilités auprès de l’établissement, puis vous confirme la réservation et le tarif final par WhatsApp.",
  },
  {
    id: 4,
    category: "reservation",
    question: "Puis-je modifier ou annuler ma demande ?",
    answer:
      "Oui. Contactez STAY dès que possible par WhatsApp ou par téléphone afin que notre équipe puisse mettre votre demande à jour.",
  },
  {
    id: 5,
    category: "payment",
    question: "Le paiement se fait-il directement sur STAY ?",
    answer:
      "Non. STAY facilite la mise en relation et la demande de réservation. Les modalités de paiement vous sont communiquées lors de la confirmation avec l’établissement.",
  },
  {
    id: 6,
    category: "support",
    question: "Comment contacter STAY ?",
    answer:
      "Notre équipe est disponible par WhatsApp ou par téléphone pour répondre à vos questions et vous accompagner dans votre demande de réservation.",
  },
];

const categories = [
  {
    id: "all",
    label: "Toutes",
  },
  {
    id: "reservation",
    label: "Réservation",
  },
  {
    id: "payment",
    label: "Tarifs & paiement",
  },
  {
    id: "support",
    label: "Assistance",
  },
];

function FAQ() {
  const [openItemId, setOpenItemId] = useState(null);
  const [activeCategory, setActiveCategory] =
    useState("all");

  const filteredFaqItems =
    activeCategory === "all"
      ? faqItems
      : faqItems.filter(
          (item) =>
            item.category === activeCategory,
        );

  const toggleItem = (itemId) => {
    setOpenItemId((currentId) =>
      currentId === itemId ? null : itemId,
    );
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setOpenItemId(null);
  };

  return (
    <main className="faq-page">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="faq-hero">
        <div className="faq-hero-meta">
          <span>04 / FAQ</span>
        </div>

        <div className="faq-hero-content">
          <h1>
            Questions,
            <span>simplement.</span>
          </h1>
        </div>
      </section>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <section className="faq-filters">
        <div className="faq-filter-label">
          <span>Explorer par thème</span>
        </div>

        <div className="faq-filter-list">
          {categories.map((category, index) => {
            const isActive =
              activeCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                className={
                  isActive
                    ? "faq-filter is-active"
                    : "faq-filter"
                }
                onClick={() =>
                  handleCategoryChange(
                    category.id,
                  )
                }
                aria-pressed={isActive}
              >
                <span className="faq-filter-number">
                  {String(index + 1).padStart(
                    2,
                    "0",
                  )}
                </span>

                <span>
                  {category.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          QUESTIONS
      ====================================================== */}

      <section className="faq-questions">
        <div className="faq-questions-header">
          <span>À savoir</span>

          <span>
            {filteredFaqItems.length} résultat
            {filteredFaqItems.length > 1
              ? "s"
              : ""}
          </span>
        </div>

        <div className="faq-list">
          {filteredFaqItems.map(
            (item, index) => {
              const isOpen =
                openItemId === item.id;

              const answerId =
                `faq-answer-${item.id}`;

              return (
                <article
                  key={item.id}
                  className={
                    isOpen
                      ? "faq-item is-open"
                      : "faq-item"
                  }
                >
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() =>
                      toggleItem(item.id)
                    }
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                  >
                    <span className="faq-question-number">
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>

                    <span className="faq-question-text">
                      {item.question}
                    </span>

                    <span
                      className="faq-question-icon"
                      aria-hidden="true"
                    >
                      <span />
                      <span />
                    </span>
                  </button>

                  <div
                    id={answerId}
                    className="faq-answer-wrapper"
                    aria-hidden={!isOpen}
                  >
                    <div className="faq-answer">
                      <div className="faq-answer-spacer" />

                      <p>
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </article>
              );
            },
          )}
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <section className="faq-end">
        <span>STAY</span>

        <p>
          Chaque séjour commence par une question.
          Les bonnes adresses viennent ensuite.
        </p>

        <span>
          Cotonou · Bénin
        </span>
      </section>
    </main>
  );
}

export default FAQ;
